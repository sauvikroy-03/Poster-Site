export type Orientation = "vertical" | "horizontal";
export type Source = "upload" | "pinterest";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_MB = 20;

/** A-series paper (A5, A4, A3...) is always 1 : 1.414 */
export const A_RATIO = 1 / Math.SQRT2;

/** false = photos start fully visible (white borders possible). true = start zoomed to cover the poster. */
export const START_FILLED = false;

export interface OrientationDef {
  id: Orientation;
  label: string;
  ratio: number; // width / height of the print
}

export const ORIENTATIONS: OrientationDef[] = [
  { id: "vertical", label: "Vertical", ratio: A_RATIO },
  { id: "horizontal", label: "Landscape", ratio: 1 / A_RATIO },
];

/* ---------- Split posters: one picture cut into panels ---------- */

export const SPLIT_PIECES = 3;

/**
 * Direction of the cut lines.
 * "vertical"   = lines run top to bottom, panels sit side by side (the Defender example)
 * "horizontal" = lines run left to right, panels are stacked
 * Swap these two values if you want it the other way round.
 */
export const SPLIT_LINES: Record<Orientation, "vertical" | "horizontal"> = {
  vertical: "horizontal",
  horizontal: "vertical",
};

export interface SplitGuide {
  lines: "vertical" | "horizontal";
  pieces: number;
}

export const splitGuide = (o: Orientation): SplitGuide => ({
  lines: SPLIT_LINES[o],
  pieces: SPLIT_PIECES,
});

/* ---------- Sizes ---------- */

export interface SizeDef {
  id: string;
  label: string;
  mm: [number, number]; // portrait width x height
  splitOk: boolean;
}

export const SIZES: SizeDef[] = [
  { id: "a5", label: "A5", mm: [148, 210], splitOk: false },
  { id: "a4", label: "A4", mm: [210, 297], splitOk: true },
  { id: "a3", label: "A3", mm: [297, 420], splitOk: true },
];

/** Print size in mm for the chosen orientation */
export const printMm = (o: Orientation, size: SizeDef): [number, number] =>
  o === "vertical" ? [size.mm[0], size.mm[1]] : [size.mm[1], size.mm[0]];

/** One panel of a split print, in mm */
export const panelMm = (o: Orientation, size: SizeDef): [number, number] => {
  const [w, h] = printMm(o, size);
  return SPLIT_LINES[o] === "vertical" ? [w / SPLIT_PIECES, h] : [w, h / SPLIT_PIECES];
};

/* ---------- The wall used in the preview ---------- */

export const WALL = {
  src: "/wall1.png", // put your wall photo in /public
  aspect: 3 / 2, // width / height of that photo
  widthMm: 1000, // how wide the photo is in real life. Bigger number = smaller poster on the wall
  centerX: 0.46, // where the poster hangs, as a fraction of the wall photo
  centerY: 0.4,
};

/* ---------- Photo + fit ---------- */

export interface PickedImage {
  url: string;
  name: string;
  bytes: number;
  width: number;
  height: number;
  source: Source;
}

/**
 * How the photo sits in the frame. Stored as fractions, not pixels, so the same values
 * draw identically in the modal, the card, the wall preview and (later) the print file.
 * zoom: 1 = whole photo visible. x / y: offset in frame widths. turns: quarter turns.
 */
export interface Fit {
  zoom: number;
  x: number;
  y: number;
  turns: number;
  flip: boolean;
}

export const DEFAULT_FIT: Fit = { zoom: 1, x: 0, y: 0, turns: 0, flip: false };

type Dims = { width: number; height: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function geometry(img: Dims, turns: number, ratio: number) {
  const swap = Math.abs(turns) % 2 === 1;
  const w = swap ? img.height : img.width; // photo size after rotating, in photo pixels
  const h = swap ? img.width : img.height;
  const frameH = 1 / ratio; // frame height, in frame widths
  const containScale = Math.min(1 / w, frameH / h); // frame widths per photo pixel when the whole photo fits
  const coverScale = Math.max(1 / w, frameH / h);
  const coverZoom = coverScale / containScale;
  return { w, h, frameH, containScale, coverZoom, maxZoom: Math.max(coverZoom * 3, 3) };
}

/** Keeps the photo inside the frame: centered if smaller than the frame, never leaving a gap if bigger */
export function clampFit(fit: Fit, img: Dims, ratio: number): Fit {
  const g = geometry(img, fit.turns, ratio);
  const zoom = clamp(fit.zoom, 1, g.maxZoom);
  const scale = g.containScale * zoom;
  const maxX = Math.max(0, (g.w * scale - 1) / 2);
  const maxY = Math.max(0, (g.h * scale - g.frameH) / 2);
  return { ...fit, zoom, x: clamp(fit.x, -maxX, maxX), y: clamp(fit.y, -maxY, maxY) };
}

export function initialFit(img: Dims, ratio: number, turns = 0, flip = false): Fit {
  const g = geometry(img, turns, ratio);
  return { zoom: START_FILLED ? g.coverZoom : 1, x: 0, y: 0, turns, flip };
}

// The zoom slider is logarithmic so it feels even whether the photo needs 1.1x or 10x to fill the frame
export const zoomToSlider = (zoom: number, maxZoom: number) => Math.log(zoom) / Math.log(maxZoom);
export const sliderToZoom = (t: number, maxZoom: number) => Math.pow(maxZoom, t);

export type QualityLevel = "good" | "soft" | "low";

export function printQuality(img: Dims, fit: Fit, o: OrientationDef, size: SizeDef) {
  const g = geometry(img, fit.turns, o.ratio);
  const scale = g.containScale * fit.zoom; // frame widths per photo pixel
  const widthIn = printMm(o.id, size)[0] / 25.4;
  const dpi = 1 / scale / widthIn; // photo pixels per printed inch
  const level: QualityLevel = dpi >= 150 ? "good" : dpi >= 100 ? "soft" : "low";
  const covers = fit.zoom >= g.coverZoom - 0.005;
  return { dpi: Math.round(dpi), level, covers };
}

export function loadPickedImage(file: File, source: Source): Promise<PickedImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error("Use a JPG, PNG or WEBP image."));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      reject(new Error(`That file is over ${MAX_MB} MB. Try a smaller one.`));
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = new window.Image();
    probe.onload = () =>
      resolve({
        url,
        name: file.name,
        bytes: file.size,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        source,
      });
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We couldn't read that image. Try another file."));
    };
    probe.src = url;
  });
}