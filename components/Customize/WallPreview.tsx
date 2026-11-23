"use client";

import React from "react";
import Image from "next/image";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DummyArt from "./DummyArt";
import FitFrame, { FrameShell } from "./FitFrame";
import {
  WALL,
  printMm,
  printQuality,
  type Fit,
  type OrientationDef,
  type PickedImage,
  type SizeDef,
  type SplitGuide,
} from "./shared";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface WallPreviewProps {
  orientation: OrientationDef;
  split: SplitGuide | null;
  image: PickedImage | null;
  fit: Fit;
  size: SizeDef;
  onAdjust: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

const actionBtn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 border-2 border-border bg-card px-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-foreground transition-colors sm:px-3";

export default function WallPreview({
  orientation,
  split,
  image,
  fit,
  size,
  onAdjust,
  onReplace,
  onRemove,
}: WallPreviewProps) {
  const [wMm, hMm] = printMm(orientation.id, size);
  // Width as a share of the wall: this is what makes A5 look small and A3 look big
  const widthPct = (wMm / WALL.widthMm) * 100;
  const q = image ? printQuality(image, fit, orientation, size) : null;

  return (
    <div className="border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]">
      {/* ---------- The wall ---------- */}
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: String(WALL.aspect) }}>
        <Image
          src={WALL.src}
          alt=""
          fill
          sizes="(max-width: 1100px) 100vw, 1000px"
          className="select-none object-cover"
        />

        {/* Size tag */}
        {/* <span className="absolute left-2 top-2 border-2 border-border bg-card px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-foreground sm:left-3 sm:top-3 sm:text-[11px]">
          {size.label} · {wMm} × {hMm} mm
        </span> */}

        {/* The poster, hung on the wall */}
        <div
          className="absolute transition-[width] duration-300 ease-out"
          style={{
            left: `${WALL.centerX * 100}%`,
            top: `${WALL.centerY * 100}%`,
            width: `${widthPct}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative shadow-[0_10px_22px_rgba(0,0,0,0.28),0_2px_5px_rgba(0,0,0,0.25)]">
            {image ? (
              <FitFrame
                plain
                image={image}
                fit={fit}
                ratio={orientation.ratio}
                split={split}
                guideStyle="solid"
              />
            ) : (
              <FrameShell plain ratio={orientation.ratio} split={split} guideStyle="solid">
                <DummyArt ratio={orientation.ratio} />
              </FrameShell>
            )}
            {/* A touch of light so the print doesn't look flat */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10"
            />
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      {image && q ? (
        <div className="flex flex-col gap-3 border-t-2 border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              {image.name}
            </p>
            <p
              className={cn(
                "mt-1 inline-block border-2 border-border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                q.level === "low" ? "bg-destructive/10 text-destructive" : "bg-accent text-foreground"
              )}
            >
              {q.level === "good" ? "Looks sharp" : q.level === "soft" ? "A little soft" : "Low quality"} ·{" "}
              {q.dpi} dpi at {size.label}
              {!q.covers && " · white borders"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button type="button" onClick={onAdjust} className={cn(FOCUS, actionBtn, "bg-accent hover:bg-accent")}>
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
              Adjust
            </button>
            <button type="button" onClick={onReplace} className={cn(FOCUS, actionBtn, "hover:bg-muted")}>
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={cn(FOCUS, actionBtn, "hover:bg-destructive hover:text-white")}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="border-t-2 border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
          {/* Add a photo above and it appears here, hung on a wall at the size you pick. */}
        </p>
      )}
    </div>
  );
}