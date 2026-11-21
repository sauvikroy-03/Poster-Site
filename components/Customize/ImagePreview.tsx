"use client";

import React, { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES } from "./ImageDropzone";


const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface ImagePreviewProps {
  url: string | null;
  name?: string;
  onReplace: (file: File) => void;
  onRemove: () => void;
}

export default function ImagePreview({ url, name, onReplace, onRemove }: ImagePreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------- Empty ----------
  if (!url) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 border-4 border-dashed border-border bg-muted p-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center border-2 border-border bg-card shadow-[3px_3px_0_0_var(--border)]">
          <ImageIcon className="h-6 w-6 text-foreground" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-2xl font-black uppercase leading-none tracking-tight text-foreground">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Upload a photo or paste a pin and it shows up in full right here.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Filled: whole image, never cropped ----------
  return (
    <>
      {/* Outer ring in accent, inner frame in ink */}
      <div className="border-4 border-accent bg-foreground p-3 dark:bg-card sm:p-4">
        <div className="relative flex min-h-[240px] items-center justify-center bg-muted px-4 pb-20 pt-4 sm:px-6 sm:pt-6">
          {/* Natural size, capped to the frame. Never stretched, never cropped. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name ? `Preview of ${name}` : "Your selected image"}
            className="block h-auto max-h-[70vh] w-auto max-w-full"
          />

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                FOCUS,
                "cursor-pointer border-2 border-border bg-accent px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
              )}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={cn(
                FOCUS,
                "cursor-pointer border-2 border-border bg-card px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:bg-destructive hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
              )}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onReplace(file);
          e.target.value = "";
        }}
      />
    </>
  );
}