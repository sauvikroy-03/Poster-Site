"use client";

import React from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import DummyArt from "./DummyArt";
import FitFrame, { FrameShell } from "./FitFrame";
import { posterRatio, type Fit, type OrientationDef, type PickedImage, type SplitGuide } from "./shared";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface FormatCardProps {
  orientation: OrientationDef;
  split: SplitGuide | null;
  image: PickedImage | null;
  fit: Fit;
  onOpen: () => void;
}

export default function FormatCard({ orientation, split, image, fit, onOpen }: FormatCardProps) {
  const vertical = orientation.id === "vertical";
  const ratio = posterRatio(orientation.id, !!split);
  // Caps the poster's height so it never gets taller than the screen allows
  const maxHeight = vertical
    ? split
      ? "min(440px, 56dvh)"
      : "min(380px, 52dvh)"
    : "min(300px, 40dvh)";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={image ? "Adjust your photo" : "Add your photo"}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        FOCUS,
        "relative flex min-h-[300px] cursor-pointer items-center justify-center border-2 border-border bg-muted p-5 shadow-[4px_4px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--border)] sm:p-8"
      )}
    >
      {image ? (
        <>
          <FitFrame
            image={image}
            fit={fit}
            ratio={ratio}
            split={split}
            maxHeight={maxHeight}
          />
          <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
            <Pencil className="h-3 w-3" strokeWidth={3} />
            Adjust
          </span>
        </>
      ) : (
        <FrameShell ratio={ratio} split={split} maxHeight={maxHeight}>
          <DummyArt ratio={ratio} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Add photo
            </span>
          </span>
        </FrameShell>
      )}
    </div>
  );
}