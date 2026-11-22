"use client";

import React, { useRef } from "react";
import { Image as ImageIcon, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES } from "./ImageDropzone";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface ImagePreviewProps {
  url: string | null;
  name?: string;
  onEdit: () => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
}

export default function ImagePreview({ url, name, onEdit, onReplace, onRemove }: ImagePreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------- Empty ----------
  if (!url) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-muted p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]">
          <ImageIcon className="h-5 w-5 text-foreground" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-lg font-black uppercase leading-none tracking-tight text-foreground">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Your photo shows up here in full.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Filled: whole image, never cropped ----------
  return (
    <>
      <div className="border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]">
        <div className="flex items-center justify-center bg-muted p-4 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name ? `Preview of ${name}` : "Your selected image"}
            className="block h-auto max-h-[70vh] w-auto max-w-full"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border px-4 py-3">
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            {name ?? "Selected image"}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                FOCUS,
                "inline-flex h-9 cursor-pointer items-center gap-1.5 border-2 border-border bg-accent px-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground shadow-[2px_2px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              )}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                FOCUS,
                "inline-flex h-9 cursor-pointer items-center gap-1.5 border-2 border-border bg-card px-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-muted"
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={cn(
                FOCUS,
                "inline-flex h-9 cursor-pointer items-center gap-1.5 border-2 border-border bg-card px-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-destructive hover:text-white"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
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