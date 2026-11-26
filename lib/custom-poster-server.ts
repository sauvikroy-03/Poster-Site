import "server-only";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { r2 } from "@/lib/r2";
import {
  toCustomConfigJson,
  type CustomFit,
  type CustomOrientation,
  type CustomPosterConfig,
} from "@/lib/custom-poster";
import {
  geometry,
  posterRatio,
  SPLIT_LINES,
  SPLIT_PIECES,
} from "@/components/Customize/shared";

export const PENDING_PREFIX = "custom/pending/";

export function getR2Config() {
  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFARE_R2_BUCKET_NAME;
  const publicDomain =
    process.env.CLOUDFLARE_PUBLIC_DOMAIN || process.env.CLOUDFARE_PUBLIC_DOMAIN;

  if (!bucketName || !publicDomain) {
    return null;
  }

  return {
    bucketName,
    baseDomain: publicDomain.replace(/\/+$/, ""),
  };
}

export function keyFromPublicUrl(url: string | null | undefined, baseDomain: string): string | null {
  if (!url) return null;
  const prefix = `${baseDomain}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export async function deleteR2Keys(bucketName: string, keys: string[]): Promise<void> {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return;

  await Promise.allSettled(
    unique.map((Key) => r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key })))
  );
}

async function getR2ObjectBuffer(bucketName: string, key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  if (!res.Body) {
    throw new Error(`Empty R2 object body for key: ${key}`);
  }
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function sliceSplitPanels(params: {
  rawBuffer: Buffer;
  isPng: boolean;
  orientation: CustomOrientation;
  fit: CustomFit;
}): Promise<Buffer[]> {
  const { rawBuffer, isPng, orientation, fit } = params;

  // Stage 1: normalize EXIF orientation first, then apply user rotation & horizontal flip
  const exifFixed = await sharp(rawBuffer).rotate().toBuffer();
  const deg = (((fit.turns % 4) + 4) % 4) * 90;
  let orientedBuf = exifFixed;
  if (deg !== 0 || fit.flip) {
    let pipe = sharp(exifFixed);
    if (deg !== 0) pipe = pipe.rotate(deg);
    if (fit.flip) pipe = pipe.flop();
    orientedBuf = await pipe.toBuffer();
  }

  const orientedMeta = await sharp(orientedBuf).metadata();
  const imgW = orientedMeta.width;
  const imgH = orientedMeta.height;
  if (!imgW || !imgH) {
    throw new Error("Could not read oriented image dimensions.");
  }

  const ratio = posterRatio(orientation, true);
  const g = geometry({ width: imgW, height: imgH }, 0, ratio);

  // Preserve native resolution where possible, capped at 6000px max dimension
  const nativeFrameW = Math.round(1 / (g.containScale * fit.zoom));
  let frameW = Math.max(nativeFrameW, 1200);
  let frameH = Math.round(frameW / ratio);
  const maxDim = 6000;
  if (frameW > maxDim || frameH > maxDim) {
    const capScale = maxDim / Math.max(frameW, frameH);
    frameW = Math.max(1, Math.round(frameW * capScale));
    frameH = Math.max(1, Math.round(frameH * capScale));
  }

  const drawW = Math.max(1, Math.round(imgW * g.containScale * fit.zoom * frameW));
  const drawH = Math.max(1, Math.round(imgH * g.containScale * fit.zoom * frameW));
  const left = Math.round(frameW / 2 + fit.x * frameW - drawW / 2);
  const top = Math.round(frameH / 2 + fit.y * frameW - drawH / 2);

  const scaledBuf =
    drawW === imgW && drawH === imgH
      ? orientedBuf
      : await sharp(orientedBuf).resize(drawW, drawH, { fit: "fill" }).toBuffer();

  const splitLines = SPLIT_LINES[orientation];
  const panels: Buffer[] = [];

  for (let i = 0; i < SPLIT_PIECES; i++) {
    const px0 = splitLines === "vertical" ? Math.round((i * frameW) / SPLIT_PIECES) : 0;
    const px1 = splitLines === "vertical" ? Math.round(((i + 1) * frameW) / SPLIT_PIECES) : frameW;
    const py0 = splitLines === "horizontal" ? Math.round((i * frameH) / SPLIT_PIECES) : 0;
    const py1 = splitLines === "horizontal" ? Math.round(((i + 1) * frameH) / SPLIT_PIECES) : frameH;

    const panelW = Math.max(1, px1 - px0);
    const panelH = Math.max(1, py1 - py0);

    const ix0 = Math.max(px0, left);
    const iy0 = Math.max(py0, top);
    const ix1 = Math.min(px1, left + drawW);
    const iy1 = Math.min(py1, top + drawH);

    let panelPipe: ReturnType<typeof sharp>;

    if (ix1 > ix0 && iy1 > iy0) {
      const cropBuf = await sharp(scaledBuf)
        .extract({
          left: ix0 - left,
          top: iy0 - top,
          width: ix1 - ix0,
          height: iy1 - iy0,
        })
        .toBuffer();

      if (ix0 === px0 && iy0 === py0 && ix1 === px1 && iy1 === py1) {
        panelPipe = sharp(cropBuf);
      } else {
        panelPipe = sharp({
          create: {
            width: panelW,
            height: panelH,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
          },
        }).composite([{ input: cropBuf, left: ix0 - px0, top: iy0 - py0 }]);
      }
    } else {
      panelPipe = sharp({
        create: {
          width: panelW,
          height: panelH,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      });
    }

    const encoded = isPng
      ? await panelPipe.png().toBuffer()
      : await panelPipe
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();

    panels.push(encoded);
  }

  return panels;
}

/**
 * Moves a custom poster's pending cart assets into permanent order storage
 * (`custom/orders/<orderId>/<orderItemId>/...`) and slices the 3 split panels
 * only after payment is verified.
 */
export async function promoteCustomOrderAssets(params: {
  orderId: string;
  orderItemId: string;
  custom: CustomPosterConfig;
}): Promise<{
  updatedConfig: CustomPosterConfig;
  pendingKeysToDelete: string[];
}> {
  const { orderId, orderItemId, custom } = params;
  const r2Cfg = getR2Config();
  if (!r2Cfg) {
    throw new Error("Missing R2 storage configuration.");
  }

  const { bucketName, baseDomain } = r2Cfg;
  const pendingRawKey = keyFromPublicUrl(custom.original_url, baseDomain);
  const pendingPreviewKey = keyFromPublicUrl(custom.preview_url, baseDomain);

  if (!pendingRawKey) {
    return { updatedConfig: custom, pendingKeysToDelete: [] };
  }

  const extMatch = pendingRawKey.match(/\.([a-zA-Z0-9]+)$/);
  const rawExt = (extMatch?.[1] ?? "jpg").toLowerCase();
  const isPng = rawExt === "png";

  const orderDir = `custom/orders/${orderId}/${orderItemId}`;
  const permRawKey = `${orderDir}/raw.${rawExt}`;
  const permPreviewKey = `${orderDir}/preview.webp`;

  const copyPromises: Promise<unknown>[] = [
    r2.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        Key: permRawKey,
        CopySource: encodeURI(`${bucketName}/${pendingRawKey}`),
      })
    ),
  ];

  if (pendingPreviewKey) {
    copyPromises.push(
      r2.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          Key: permPreviewKey,
          CopySource: encodeURI(`${bucketName}/${pendingPreviewKey}`),
        })
      )
    );
  }

  let panelUrls: string[] | undefined = custom.panel_urls;

  // Fetch raw buffer and slice the 3 split panels only when split is enabled
  const rawBufferPromise = custom.split
    ? getR2ObjectBuffer(bucketName, pendingRawKey)
    : Promise.resolve(null);

  const [, rawBuffer] = await Promise.all([
    Promise.all(copyPromises),
    rawBufferPromise,
  ]);

  if (custom.split && rawBuffer) {
    const panelExt = isPng ? "png" : "jpg";
    const panelMime = isPng ? "image/png" : "image/jpeg";
    const panelBuffers = await sliceSplitPanels({
      rawBuffer,
      isPng,
      orientation: custom.orientation,
      fit: custom.fit,
    });

    const uploads = panelBuffers.map((buf, idx) => {
      const key = `${orderDir}/panel-${idx + 1}.${panelExt}`;
      return {
        url: `${baseDomain}/${key}`,
        promise: r2.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buf,
            ContentType: panelMime,
          })
        ),
      };
    });

    await Promise.all(uploads.map((u) => u.promise));
    panelUrls = uploads.map((u) => u.url);
  }

  const pendingKeysToDelete = [pendingRawKey, pendingPreviewKey]
    .filter((k): k is string => !!k && k.startsWith(PENDING_PREFIX));

  const updatedConfig: CustomPosterConfig = {
    ...custom,
    original_url: `${baseDomain}/${permRawKey}`,
    preview_url: pendingPreviewKey ? `${baseDomain}/${permPreviewKey}` : custom.preview_url,
    ...(panelUrls?.length ? { panel_urls: panelUrls } : {}),
  };

  return { updatedConfig, pendingKeysToDelete };
}

export function buildCustomOrderItemUpdate(cfg: CustomPosterConfig) {
  return {
    prod_image: cfg.preview_url || cfg.original_url,
    custom_config: toCustomConfigJson(cfg),
  };
}
