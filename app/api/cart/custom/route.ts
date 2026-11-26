import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { r2 } from "@/lib/r2";
import { getAuthedClient } from "@/lib/supabase-server";
import {
  DEFAULT_CUSTOM_MATERIAL,
  toCustomConfigJson,
  type CustomFit,
  type CustomOrientation,
  type CustomPosterConfig,
  type CustomSizeId,
  type CustomSource,
} from "@/lib/custom-poster";
import {
  deleteR2Keys,
  getR2Config,
  PENDING_PREFIX,
} from "@/lib/custom-poster-server";
import { SPLIT_LINES, SPLIT_PIECES } from "@/components/Customize/shared";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_QUANTITY = 99;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIZE_LABELS: Record<CustomSizeId, string> = {
  a5: "A5",
  a4: "A4",
  a3: "A3",
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

interface IncomingConfig {
  size_id?: unknown;
  orientation?: unknown;
  split?: unknown;
  material?: unknown;
  source?: unknown;
  quantity?: unknown;
  fit?: Partial<CustomFit>;
}

function parseFit(raw: Partial<CustomFit> | undefined): CustomFit | null {
  if (!raw || typeof raw !== "object") return null;
  const zoom = Number(raw.zoom);
  const x = Number(raw.x);
  const y = Number(raw.y);
  const turns = Number(raw.turns);
  const flip = Boolean(raw.flip);

  if (
    !Number.isFinite(zoom) ||
    zoom < 1 ||
    zoom > 50 ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isInteger(turns)
  ) {
    return null;
  }

  return { zoom, x, y, turns, flip };
}

export async function POST(req: NextRequest) {
  const uploadedKeys: string[] = [];
  const r2Cfg = getR2Config();

  try {
    if (!r2Cfg) {
      return fail("Server storage configuration is missing.", 500);
    }
    const { bucketName, baseDomain } = r2Cfg;

    const supabase = await getAuthedClient();
    if (!supabase) {
      return fail("Server configuration error: Missing environment variables.", 500);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return fail("You must be signed in to add items to your cart.", 401);
    }

    const formData = await req.formData();
    const rawFile = formData.get("rawFile");
    const previewFile = formData.get("previewFile");
    const configRaw = formData.get("config");

    if (!(rawFile instanceof File) || rawFile.size === 0) {
      return fail("Poster image file is required.", 400);
    }
    if (!ALLOWED_MIME.has(rawFile.type)) {
      return fail("Only JPG, PNG, or WEBP images are supported.", 400);
    }
    if (rawFile.size > MAX_BYTES) {
      return fail("Image must be 20 MB or smaller.", 400);
    }
    if (typeof configRaw !== "string") {
      return fail("Missing poster configuration.", 400);
    }

    let parsed: IncomingConfig;
    try {
      parsed = JSON.parse(configRaw) as IncomingConfig;
    } catch {
      return fail("Invalid poster configuration.", 400);
    }

    const sizeId = parsed.size_id;
    if (sizeId !== "a5" && sizeId !== "a4" && sizeId !== "a3") {
      return fail("Invalid poster size.", 400);
    }

    const orientation: CustomOrientation =
      parsed.orientation === "horizontal" ? "horizontal" : "vertical";
    const split = Boolean(parsed.split);
    if (split && sizeId === "a5") {
      return fail("A5 posters cannot be split into panels.", 400);
    }

    const fit = parseFit(parsed.fit);
    if (!fit) {
      return fail("Invalid crop/fit parameters.", 400);
    }

    const source: CustomSource = parsed.source === "pinterest" ? "pinterest" : "upload";
    const requestedQty = Number(parsed.quantity ?? 1);
    if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > MAX_QUANTITY) {
      return fail(`Quantity must be between 1 and ${MAX_QUANTITY}.`, 400);
    }

    // Validate material against the materials table (fall back to default if none exist)
    const requestedMaterial =
      typeof parsed.material === "string" ? parsed.material.trim() : "";

    const { data: materialRows } = await supabase
      .from("materials")
      .select("material_name");

    let verifiedMaterial = DEFAULT_CUSTOM_MATERIAL;
    if (materialRows && materialRows.length > 0) {
      const match = materialRows.find(
        (m) => m.material_name.toLowerCase() === requestedMaterial.toLowerCase()
      );
      if (!match) {
        return fail("Selected paper material is not valid.", 400);
      }
      verifiedMaterial = match.material_name;
    } else if (requestedMaterial) {
      verifiedMaterial = requestedMaterial;
    }

    // Verify raw image with sharp and extract natural dimensions
    const rawBuffer = Buffer.from(await rawFile.arrayBuffer());
    let metadata;
    try {
      metadata = await sharp(rawBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        return fail("Could not read image dimensions.", 400);
      }
    } catch {
      return fail("The uploaded file is not a valid image.", 400);
    }

    // Re-encode preview via sharp to ensure clean WebP output
    let previewBuffer: Buffer;
    if (previewFile instanceof File && previewFile.size > 0) {
      try {
        previewBuffer = await sharp(Buffer.from(await previewFile.arrayBuffer()))
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 84 })
          .toBuffer();
      } catch {
        previewBuffer = await sharp(rawBuffer)
          .rotate()
          .resize({ width: 1000, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      }
    } else {
      previewBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: 1000, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    }

    // Stage in pending/ until payment succeeds (split panels are sliced only after payment)
    const id = crypto.randomUUID();
    const ts = Date.now();
    const rawExt =
      rawFile.type === "image/png" ? "png" : rawFile.type === "image/webp" ? "webp" : "jpg";
    const rawKey = `${PENDING_PREFIX}${user.id}/${ts}-${id}-raw.${rawExt}`;
    const previewKey = `${PENDING_PREFIX}${user.id}/${ts}-${id}-preview.webp`;

    await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: rawKey,
          Body: rawBuffer,
          ContentType: rawFile.type,
        })
      ),
      r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: previewKey,
          Body: previewBuffer,
          ContentType: "image/webp",
        })
      ),
    ]);
    uploadedKeys.push(rawKey, previewKey);

    const customConfig: CustomPosterConfig = {
      type: "custom_poster",
      size_id: sizeId,
      size_label: SIZE_LABELS[sizeId],
      orientation,
      split,
      split_pieces: split ? SPLIT_PIECES : 1,
      split_lines: split ? SPLIT_LINES[orientation] : null,
      material: verifiedMaterial,
      fit,
      source,
      preview_url: `${baseDomain}/${previewKey}`,
      original_url: `${baseDomain}/${rawKey}`,
      original_width: metadata.width,
      original_height: metadata.height,
    };

    const { data, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        prod_id: null,
        variant_id: null,
        quantity: requestedQty,
        custom_config: toCustomConfigJson(customConfig),
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Custom Cart Insert Error:", insertError.message);
      await deleteR2Keys(bucketName, uploadedKeys);
      return fail(insertError.message, 400);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Custom poster added to cart.",
        item: data,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Custom Cart Route Catch:", err);
    if (r2Cfg && uploadedKeys.length > 0) {
      await deleteR2Keys(r2Cfg.bucketName, uploadedKeys);
    }
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}
