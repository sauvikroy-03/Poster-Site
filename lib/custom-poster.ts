import type { Json } from "@/types/supabase";

export type CustomOrientation = "vertical" | "horizontal";
export type CustomSizeId = "a5" | "a4" | "a3";
export type CustomSource = "upload" | "pinterest";

export interface CustomFit {
  zoom: number;
  x: number;
  y: number;
  turns: number;
  flip: boolean;
}

export interface CustomPosterConfig {
  type: "custom_poster";
  size_id: CustomSizeId;
  size_label: string;
  orientation: CustomOrientation;
  split: boolean;
  split_pieces: number;
  split_lines: "vertical" | "horizontal" | null;
  material: string;
  fit: CustomFit;
  source: CustomSource;
  preview_url: string;
  original_url: string;
  panel_urls?: string[];
  original_width: number;
  original_height: number;
}

/**
 * Canonical custom poster pricing (in INR).
 * Both the Customize Studio UI and server-side checkout/coupon routes read from here.
 * Update these values whenever you want to change custom poster prices.
 */
export const CUSTOM_POSTER_PRICES: Record<
  CustomSizeId,
  { single: number; split: number }
> = {
  a5: { single: 1, split: 1 },
  a4: { single: 1, split: 1 },
  a3: { single: 1, split: 1 },
};

export const DEFAULT_CUSTOM_MATERIAL = "300 GSM Matte Paper";

export function getCustomPosterPrice(params: {
  sizeId: CustomSizeId;
  split: boolean;
  material?: string | null;
}): number {
  const tier = CUSTOM_POSTER_PRICES[params.sizeId] ?? CUSTOM_POSTER_PRICES.a4;
  return params.split ? tier.split : tier.single;
}

export function formatCustomPosterName(cfg: CustomPosterConfig): string {
  const orientLabel = cfg.orientation === "vertical" ? "Vertical" : "Landscape";
  const splitLabel = cfg.split ? ` · ${cfg.split_pieces}-Panel Split` : "";
  return `Custom Poster (${orientLabel}${splitLabel})`;
}

export function getCustomPosterSku(cfg: CustomPosterConfig): string {
  const sizeCode = cfg.size_label.toUpperCase();
  const orientCode = cfg.orientation === "vertical" ? "VERT" : "HORZ";
  const splitCode = cfg.split ? `SPLIT${cfg.split_pieces}` : "1P";
  return `CUSTOM-${sizeCode}-${orientCode}-${splitCode}`;
}

export function isCustomPosterConfig(val: unknown): val is CustomPosterConfig {
  if (!val || typeof val !== "object") return false;
  const obj = val as Record<string, unknown>;
  return (
    obj.type === "custom_poster" &&
    (obj.size_id === "a5" || obj.size_id === "a4" || obj.size_id === "a3") &&
    (obj.orientation === "vertical" || obj.orientation === "horizontal") &&
    typeof obj.split === "boolean" &&
    typeof obj.material === "string" &&
    typeof obj.original_url === "string"
  );
}

export function toCustomConfigJson(cfg: CustomPosterConfig): Json {
  return cfg as unknown as Json;
}
