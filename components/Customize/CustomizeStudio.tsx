"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ImageDropzone, { ACCEPTED_TYPES } from "./ImageDropzone";
import ImagePreview from "./ImagePreview";
import PinterestInput from "./PinterestInput";

type Source = "upload" | "pinterest";

const MAX_MB = 20;

interface PickedImage {
  url: string;
  name: string;
  bytes: number;
  width: number;
  height: number;
  source: Source;
}

export default function CustomizeStudio() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState("");
  const urlRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Free the in-memory file when leaving the page
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // Whenever a new image lands, bring the preview into view
  useEffect(() => {
    if (!image?.url) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [image?.url]);

  // One entry point for every image, whether it was uploaded or fetched from a pin
  const handleFile = (file: File, from: Source = "upload") => {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB} MB. Try a smaller one.`);
      return;
    }

    const url = URL.createObjectURL(file);
    const probe = new window.Image();

    probe.onload = () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setImage({
        url,
        name: file.name,
        bytes: file.size,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        source: from,
      });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setError("We couldn't read that image. Try another file.");
    };
    probe.src = url;
  };

  const handleRemove = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setImage(null);
    setError("");
  };

  // Placeholder until the backend exists. To go live, replace the body with:
  //   const res = await fetch(`/api/pinterest?url=${encodeURIComponent(url)}`);
  //   if (!res.ok) throw new Error("Couldn't fetch that pin.");
  //   const blob = await res.blob();
  //   handleFile(new File([blob], "pinterest-pin.jpg", { type: blob.type }), "pinterest");
  const resolvePin = async (_url: string) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    throw new Error("Pinterest import is coming soon. Upload a photo for now.");
  };

  const labelClass =
    "font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground";

  return (
    <div className="mt-12 flex flex-col gap-8">
      {/* ================= Step 01 ================= */}
      <section className="border-2 border-border bg-card p-5 shadow-[6px_6px_0_0_var(--border)] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b-2 border-border pb-5">
          <div>
            <p className={labelClass}>Step 01 / Source</p>
            <h2 className="mt-2 text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
              Pick your
              <br />
              starting point.
            </h2>
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-2 border-border bg-accent text-lg font-black text-foreground">
            01
          </span>
        </div>

        {/* Upload: always the drop zone, the image never shows here */}
        <div className="pt-5">
          <ImageDropzone onFile={(file) => handleFile(file)} />
          {error && (
            <p role="alert" className="mt-3 text-sm font-bold text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* OR divider */}
        <div className="my-6 flex items-center gap-4" aria-hidden="true">
          <span className="h-0.5 flex-1 bg-border" />
          <span className="border-2 border-border bg-accent px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            Or
          </span>
          <span className="h-0.5 flex-1 bg-border" />
        </div>

        <PinterestInput onResolve={resolvePin} />

        {/* Common preview: shows the image from either source */}
        {/* scroll-mt-28 leaves room for the sticky navbar when we auto-scroll here */}
        <div ref={previewRef} className="mt-6 scroll-mt-28 border-t-2 border-border pt-5">
          <p className={cn(labelClass, "mb-3")}>Preview</p>
          <ImagePreview
            url={image?.url ?? null}
            name={image?.name}
            onReplace={(file) => handleFile(file)}
            onRemove={handleRemove}
          />
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Your original file stays untouched. The preview scales down to fit, but never crops or
            trims the edges.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t-2 border-border pt-5">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            Current source
          </span>
          <span className="max-w-[60%] truncate font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {image
              ? `${image.source === "pinterest" ? "Pinterest" : "Upload"} · ${image.name}`
              : "Waiting"}
          </span>
        </div>
      </section>

      {/* ================= Stat tiles ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border-2 border-border bg-accent p-4 text-foreground sm:p-5">
          <p className="text-4xl font-black tracking-tight">100%</p>
          <p className="mt-3 text-[11px] font-black uppercase leading-tight tracking-[0.14em]">
            Full
            <br />
            resolution
          </p>
        </div>
        <div className="border-2 border-border bg-card p-4 text-foreground sm:p-5">
          <p className="text-4xl font-black tracking-tight">0</p>
          <p className="mt-3 text-[11px] font-black uppercase leading-tight tracking-[0.14em]">
            Cropped
            <br />
            edges
          </p>
        </div>
        <div className="border-2 border-border bg-foreground p-4 text-background sm:p-5">
          <p className="text-4xl font-black tracking-tight text-accent">01</p>
          <p className="mt-3 text-[11px] font-black uppercase leading-tight tracking-[0.14em]">
            Made for
            <br />
            your wall
          </p>
        </div>
      </div>
    </div>
  );
}