"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import FormatCard from "./FormatCard";
import LayoutPicker from "./LayoutPicker";
import PhotoModal from "./PhotoModal";
import WallPreview from "./WallPreview";
import {
  DEFAULT_FIT,
  ORIENTATIONS,
  SIZES,
  SPLIT_PIECES,
  initialFit,
  panelMm,
  printMm,
  printQuality,
  splitGuide,
  type Fit,
  type Orientation,
  type PickedImage,
} from "./shared";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const labelClass = "font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground";

function StepHeader({ step, title }: { step: string; title: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-border pb-5">
      <div>
        <p className={labelClass}>Step {step}</p>
        <h2 className="mt-2 text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          {title}
        </h2>
      </div>
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-2 border-border bg-accent text-lg font-black text-foreground">
        {step}
      </span>
    </div>
  );
}

export default function CustomizeStudio() {
  const [orientationId, setOrientationId] = useState<Orientation>("vertical");
  const [split, setSplit] = useState(false);
  const [sizeId, setSizeId] = useState("a4");
  // One photo, and a remembered position for each orientation
  const [image, setImage] = useState<PickedImage | null>(null);
  const [fits, setFits] = useState<Partial<Record<Orientation, Fit>>>({});
  const [modal, setModal] = useState<"source" | "fit" | null>(null);
  const [notice, setNotice] = useState("");
  const [scrollTick, setScrollTick] = useState(0);

  const imageRef = useRef(image);
  imageRef.current = image;
  const previewRef = useRef<HTMLElement>(null);

  // Free the in-memory photo when leaving the page
  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
    };
  }, []);

  // After "Use photo", bring the wall preview into view
  useEffect(() => {
    if (scrollTick === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [scrollTick]);

  const orientation = ORIENTATIONS.find((o) => o.id === orientationId) ?? ORIENTATIONS[0];
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[1];
  const guide = split ? splitGuide(orientation.id) : null;

  const fit = useMemo(
    () => fits[orientationId] ?? (image ? initialFit(image, orientation.ratio) : DEFAULT_FIT),
    [fits, orientationId, image, orientation.ratio]
  );
  const quality = image ? printQuality(image, fit, orientation, size) : null;

  const changeOrientation = (id: Orientation) => {
    setOrientationId(id);
    setNotice("");
  };

  const changeSplit = (on: boolean) => {
    setSplit(on);
    setNotice("");
    // A5 is too small to split, so move to A4 if it was selected
    if (on && !size.splitOk) setSizeId("a4");
  };

  const openModal = (step?: "source" | "fit") => {
    setNotice("");
    setModal(step ?? (image ? "fit" : "source"));
  };

  const handleConfirm = (next: PickedImage, nextFit: Fit) => {
    const sameImage = image?.url === next.url;
    if (image && !sameImage) URL.revokeObjectURL(image.url);
    setImage(next);
    // A new photo clears the other orientation's saved position
    setFits((prev) => ({ ...(sameImage ? prev : {}), [orientationId]: nextFit }));
    setModal(null);
    setScrollTick((t) => t + 1);
  };

  const handleRemove = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setFits({});
    setNotice("");
  };

  // Asks our own route for the pin's image and hands it back as a file
  const resolvePin = async (pinUrl: string): Promise<File> => {
    let res: Response;
    try {
      res = await fetch(`/api/pinterest?url=${encodeURIComponent(pinUrl)}`);
    } catch {
      throw new Error("Network error. Check your connection and try again.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Couldn't fetch that pin.");
    }
    const blob = await res.blob();
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `pinterest-pin.${ext}`, { type: blob.type });
  };

  const [pw, ph] = panelMm(orientation.id, size);

  return (
    <div className="mt-12 flex flex-col gap-8">
      {/* ================= Step 01: layout ================= */}
      <section className="border-2 border-border bg-card p-5 shadow-[6px_6px_0_0_var(--border)] sm:p-8">
        <StepHeader
          step="01"
          title={
            <>
              Pick your
              <br />
              layout.
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 pt-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <LayoutPicker
            orientation={orientationId}
            onOrientationChange={changeOrientation}
            split={split}
            onSplitChange={changeSplit}
          />

          <div>
            <FormatCard
              orientation={orientation}
              split={guide}
              image={image}
              fit={fit}
              onOpen={() => openModal()}
            />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {image
                ? "Tap the poster to adjust, replace or fit your photo."
                : "Tap the poster to add your photo."}
            </p>
          </div>
        </div>
      </section>

      {/* ================= Step 02: on the wall ================= */}
      <section
        ref={previewRef}
        className="scroll-mt-28 border-2 border-border bg-card p-5 shadow-[6px_6px_0_0_var(--border)] sm:p-8"
      >
        <StepHeader step="02" title="On your wall." />
        <div className="pt-5">
          <WallPreview
            orientation={orientation}
            split={guide}
            image={image}
            fit={fit}
            size={size}
            onAdjust={() => openModal("fit")}
            onReplace={() => openModal("source")}
            onRemove={handleRemove}
          />
        </div>
      </section>

      {/* ================= Step 03: size + cart ================= */}
      <section className="border-2 border-border bg-card p-5 shadow-[6px_6px_0_0_var(--border)] sm:p-8">
        <StepHeader step="03" title="Pick a size." />

        <div role="radiogroup" aria-label="Poster size" className="grid grid-cols-3 gap-2 pt-5 sm:gap-3">
          {SIZES.map((s) => {
            const disabled = split && !s.splitOk;
            const selected = s.id === sizeId;
            const [w, h] = printMm(orientation.id, s);
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => setSizeId(s.id)}
                className={cn(
                  FOCUS,
                  "flex cursor-pointer flex-col gap-1 border-2 border-border p-3 text-left transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-40 sm:p-4",
                  selected
                    ? "bg-accent shadow-[3px_3px_0_0_var(--border)]"
                    : "bg-card enabled:hover:-translate-y-0.5 enabled:hover:bg-muted"
                )}
              >
                <span className="text-2xl font-black uppercase leading-none tracking-tight text-foreground sm:text-3xl">
                  {s.label}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground/70 sm:text-[11px] sm:tracking-[0.12em]">
                  {disabled ? "No split" : `${w}×${h} mm`}
                </span>
              </button>
            );
          })}
        </div>

        {split && (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            {SPLIT_PIECES} panels, each {pw} × {ph} mm.
          </p>
        )}

        {quality && image && (
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {quality.level === "good" && `At ${size.label} your photo prints sharp (about ${quality.dpi} dpi).`}
            {quality.level === "soft" &&
              `At ${size.label} your photo prints at about ${quality.dpi} dpi, so it may look slightly soft.`}
            {quality.level === "low" &&
              `At ${size.label} your photo prints at only about ${quality.dpi} dpi. Expect blur, or pick a smaller size.`}
            {!quality.covers && " Part of the poster will stay white."}
          </p>
        )}

        <div className="mt-6 border-t-2 border-border pt-5">
          <button
            type="button"
            disabled={!image}
            onClick={() =>
              setNotice("Cart is the next step. Your photo, fit and size are ready to send.")
            }
            className={cn(
              FOCUS,
              "group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 border-2 border-border bg-primary px-6 text-[13px] font-black uppercase tracking-[0.1em] text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
            )}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            Add to cart
          </button>
          {/* {!image && (
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Add a photo to your poster above to unlock this.
            </p>
          )} */}
          {notice && <p className="mt-3 text-sm font-bold text-foreground">{notice}</p>}
        </div>
      </section>

      {/* ================= Modal ================= */}
      {modal && (
        <PhotoModal
          key={modal}
          orientation={orientation}
          split={guide}
          size={size}
          startStep={modal}
          image={image}
          fit={fit}
          onResolvePin={resolvePin}
          onCancel={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}