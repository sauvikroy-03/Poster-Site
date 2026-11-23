"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ORIENTATIONS, SPLIT_PIECES, type Orientation } from "./shared";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface LayoutPickerProps {
  orientation: Orientation;
  onOrientationChange: (o: Orientation) => void;
  split: boolean;
  onSplitChange: (on: boolean) => void;
}

export default function LayoutPicker({
  orientation,
  onOrientationChange,
  split,
  onSplitChange,
}: LayoutPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Poster orientation" className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {ORIENTATIONS.map((o) => {
          const selected = o.id === orientation;
          const vertical = o.id === "vertical";
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onOrientationChange(o.id)}
              className={cn(
                FOCUS,
                "flex cursor-pointer items-center gap-3 border-2 border-border p-1 text-left transition-[transform,box-shadow] sm:p-4",
                selected
                  ? "bg-accent shadow-[3px_3px_0_0_var(--border)]"
                  : "bg-card hover:-translate-y-0.5 hover:bg-muted"
              )}
            >
              {/* Little shape that shows the orientation */}
              <span aria-hidden="true" className="flex h-9  flex-shrink-0 items-center justify-center">
                <span
                  className="block border-2 border-border bg-card"
                  style={{ width: vertical ? 20 : 30, height: vertical ? 30 : 20 }}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black uppercase leading-none tracking-tight text-foreground sm:text-2xl">
                  {o.label}
                </span>
                <span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70 sm:text-[11px]">
                  {vertical ? "1 : 1.414" : "1.414 : 1"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={split}
        onClick={() => onSplitChange(!split)}
        className={cn(
          FOCUS,
          "flex w-full cursor-pointer items-center justify-between gap-4 border-2 border-border p-3 text-left transition-colors sm:p-4",
          split ? "bg-card" : "bg-card hover:bg-muted"
        )}
      >
        <span className="min-w-0">
          <span className="block text-base font-black uppercase leading-none tracking-tight text-foreground sm:text-lg">
            Split poster
          </span>
          <span className="mt-1.5 block text-xs font-semibold leading-snug text-muted-foreground sm:text-sm">
            One picture cut into {SPLIT_PIECES} panels. A4 and A3 only.
          </span>
        </span>

        {/* Switch */}
        <span
          aria-hidden="true"
          className={cn(
            "relative h-8 w-14 flex-shrink-0 border-2 border-border transition-colors",
            split ? "bg-accent" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 border-2 border-border bg-card transition-[left]",
              split ? "left-[26px]" : "left-0.5"
            )}
          />
        </span>
      </button>
    </div>
  );
}