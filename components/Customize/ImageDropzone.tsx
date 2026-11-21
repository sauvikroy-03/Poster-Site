"use client";

import React, { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageDropzoneProps {
  onFile: (file: File) => void;
}

export default function ImageDropzone({ onFile }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          FOCUS,
          "flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-5 border-4 border-dashed border-border p-6 text-center transition-colors sm:min-h-[320px]",
          dragging ? "bg-card" : "bg-accent"
        )}
      >
        <span className="flex h-16 w-16 items-center justify-center border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]">
          <ImagePlus className="h-7 w-7 text-foreground" strokeWidth={2.5} />
        </span>

        <p className="text-3xl font-black uppercase leading-none tracking-tight text-foreground sm:text-4xl">
          {dragging ? "Drop it!" : "Upload photo"}
        </p>

        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground/70">
          Drop it here or click to browse
        </p>

        <span className="border-2 border-border bg-card px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-foreground">
          JPG / PNG / WEBP · No crop
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ""; // lets the same file be picked again
        }}
      />
    </>
  );
}