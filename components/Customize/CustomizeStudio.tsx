"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/client";
import { notifyCartUpdated } from "@/lib/cart-events";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";
import {
  DEFAULT_CUSTOM_MATERIAL,
  getCustomPosterPrice,
  type CustomSizeId,
} from "@/lib/custom-poster";
import FormatCard from "./FormatCard";
import LayoutPicker from "./LayoutPicker";
import PhotoModal from "./PhotoModal";
import WallPreview from "./WallPreview";
import {
  DEFAULT_FIT,
  ORIENTATIONS,
  SIZES,
  SPLIT_PIECES,
  clampFit,
  initialFit,
  panelMm,
  posterRatio,
  printMm,
  printQuality,
  renderPosterPreview,
  splitGuide,
  type Fit,
  type Orientation,
  type PickedImage,
} from "./shared";

type FitKey = `${Orientation}:${"single" | "split"}`;

interface MaterialOption {
  id: string;
  material_name: string;
  gsm?: number;
}

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const labelClass =
  "font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground";

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
  const [sizeId, setSizeId] = useState<CustomSizeId>("a4");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(DEFAULT_CUSTOM_MATERIAL);
  const [quantity, setQuantity] = useState(1);

  // One photo, and a remembered position for each orientation + split mode
  const [image, setImage] = useState<PickedImage | null>(null);
  const [fits, setFits] = useState<Partial<Record<FitKey, Fit>>>({});
  const [modal, setModal] = useState<"source" | "fit" | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);

  const imageRef = useRef(image);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  const previewRef = useRef<HTMLElement>(null);

  // Load paper materials from DB
  useEffect(() => {
    let active = true;
    fetch("/api/material")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active || !Array.isArray(data) || data.length === 0) return;
        const list = data as MaterialOption[];
        setMaterials(list);
        setSelectedMaterial(list[0].material_name);
      })
      .catch(() => {
        // Fall back to DEFAULT_CUSTOM_MATERIAL silently
      });
    return () => {
      active = false;
    };
  }, []);

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
    previewRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [scrollTick]);

  const orientation = ORIENTATIONS.find((o) => o.id === orientationId) ?? ORIENTATIONS[0];
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[1];
  const guide = split ? splitGuide(orientation.id) : null;
  const frameRatio = posterRatio(orientationId, split);
  const fitKey: FitKey = `${orientationId}:${split ? "split" : "single"}`;

  const rawFit =
    fits[fitKey] ?? (image ? initialFit(image, frameRatio) : DEFAULT_FIT);
  const fit = image ? clampFit(rawFit, image, frameRatio) : rawFit;
  const quality = image ? printQuality(image, fit, orientation, size, split) : null;

  const unitPrice = getCustomPosterPrice({
    sizeId,
    split,
    material: selectedMaterial,
  });
  const totalPrice = unitPrice * quantity;

  const changeOrientation = (id: Orientation) => {
    setOrientationId(id);
    setAddedToCart(false);
  };

  const changeSplit = (on: boolean) => {
    setSplit(on);
    setAddedToCart(false);
    // A5 is too small to split, so move to A4 if it was selected
    if (on && !size.splitOk) setSizeId("a4");
    // Ensure Fill is automatically applied whenever split poster is toggled on
    if (on && image) {
      const splitRatio = posterRatio(orientationId, true);
      const splitKey: FitKey = `${orientationId}:split`;
      setFits((prev) => ({ ...prev, [splitKey]: initialFit(image, splitRatio) }));
    }
  };

  const openModal = (step?: "source" | "fit") => {
    setModal(step ?? (image ? "fit" : "source"));
  };

  const handleConfirm = (next: PickedImage, nextFit: Fit) => {
    const sameImage = image?.url === next.url;
    if (image && !sameImage) URL.revokeObjectURL(image.url);
    setImage(next);
    // A new photo clears saved positions for other layout combinations
    setFits((prev) => ({ ...(sameImage ? prev : {}), [fitKey]: nextFit }));
    setAddedToCart(false);
    setModal(null);
    setScrollTick((t) => t + 1);
  };

  const handleRemove = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setFits({});
    setAddedToCart(false);
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

  const submitAddToCart = async () => {
    if (!image || isAdding) return;

    setIsAdding(true);
    try {
      let rawFile: File;
      if (image.file) {
        rawFile = image.file;
      } else {
        const blob = await fetch(image.url).then((r) => r.blob());
        rawFile = new File([blob], image.name || "custom-poster.jpg", {
          type: blob.type || "image/jpeg",
        });
      }

      const previewBlob = await renderPosterPreview(image, fit, frameRatio);

      const formData = new FormData();
      formData.append("rawFile", rawFile);
      if (previewBlob) {
        formData.append(
          "previewFile",
          new File([previewBlob], "preview.webp", { type: "image/webp" })
        );
      }
      formData.append(
        "config",
        JSON.stringify({
          size_id: sizeId,
          orientation: orientationId,
          split,
          material: selectedMaterial,
          source: image.source,
          quantity,
          fit,
        })
      );

      const res = await fetch("/api/cart/custom", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthOpen(true);
        toast.add({
          type: "warning",
          title: "Please sign in",
          description: "Sign in to save this custom poster to your cart.",
        });
        return;
      }

      if (!res.ok || !data.success) {
        toast.add({
          type: "error",
          title: "Could not add to cart",
          description: data.message || "Please try again.",
        });
        return;
      }

      playStampSound();
      notifyCartUpdated();
      setAddedToCart(true);
      toast.add({
        type: "success",
        title: "Custom poster added to cart",
        description: `${size.label} · ${selectedMaterial} · Qty ${quantity}`,
      });
    } catch {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddClick = () => {
    if (!image || isAdding) return;
    playMechanicalClick();
    void submitAddToCart();
  };

  const [pw, ph] = panelMm(orientation.id, size);
  const [tw, th] = printMm(orientation.id, size, split);

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

      {/* ================= Step 03: size + material + cart ================= */}
      <section className="border-2 border-border bg-card p-5 shadow-[6px_6px_0_0_var(--border)] sm:p-8">
        <StepHeader step="03" title="Pick a size." />

        <div
          role="radiogroup"
          aria-label="Poster size"
          className="grid grid-cols-3 gap-2 pt-5 sm:gap-3"
        >
          {SIZES.map((s) => {
            const disabled = split && !s.splitOk;
            const selected = s.id === sizeId;
            const [w, h] = printMm(orientation.id, s, split);
            const sPrice = getCustomPosterPrice({
              sizeId: s.id as CustomSizeId,
              split,
              material: selectedMaterial,
            });

            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => {
                  setSizeId(s.id as CustomSizeId);
                  setAddedToCart(false);
                }}
                className={cn(
                  FOCUS,
                  "flex cursor-pointer flex-col gap-1 border-2 border-border p-3 text-left transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-40 sm:p-4",
                  selected
                    ? "bg-accent shadow-[3px_3px_0_0_var(--border)]"
                    : "bg-card enabled:hover:-translate-y-0.5 enabled:hover:bg-muted"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-black uppercase leading-none tracking-tight text-foreground sm:text-3xl">
                    {s.label}
                  </span>
                  {!disabled && (
                    <span className="font-mono text-xs font-black text-foreground sm:text-sm">
                      ₹{sPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground/70 sm:text-[11px] sm:tracking-[0.12em]">
                  {disabled ? "No split" : `${w}×${h} mm`}
                </span>
              </button>
            );
          })}
        </div>

        {split && (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            {SPLIT_PIECES} panels, each {pw} × {ph} mm (total {tw} × {th} mm).
          </p>
        )}

        {quality && image && (
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {quality.level === "good" &&
              `At ${size.label} your photo prints sharp (about ${quality.dpi} dpi).`}
            {quality.level === "soft" &&
              `At ${size.label} your photo prints at about ${quality.dpi} dpi, so it may look slightly soft.`}
            {quality.level === "low" &&
              `At ${size.label} your photo prints at only about ${quality.dpi} dpi. Expect blur, or pick a smaller size.`}
            {!quality.covers && " Part of the poster will stay white."}
          </p>
        )}

        {/* Paper Material Picker */}
        <div className="mt-6 border-t-2 border-border pt-5">
          <p className={labelClass}>Paper stock</p>
          {materials.length > 0 ? (
            <div
              role="radiogroup"
              aria-label="Paper material"
              className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3"
            >
              {materials.map((mat) => {
                const selected = mat.material_name === selectedMaterial;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSelectedMaterial(mat.material_name);
                      setAddedToCart(false);
                    }}
                    className={cn(
                      FOCUS,
                      "flex cursor-pointer items-center justify-between gap-2 border-2 border-border px-3.5 py-2.5 text-left transition-[transform,box-shadow]",
                      selected
                        ? "bg-accent shadow-[3px_3px_0_0_var(--border)]"
                        : "bg-card hover:-translate-y-0.5 hover:bg-muted"
                    )}
                  >
                    <span className="text-xs font-black uppercase tracking-tight text-foreground">
                      {mat.material_name}
                    </span>
                    {mat.gsm ? (
                      <span className="font-mono text-[10px] font-bold uppercase text-foreground/70">
                        {mat.gsm} GSM
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 font-mono text-xs font-bold uppercase text-foreground">
              {selectedMaterial}
            </p>
          )}
        </div>

        {/* Price + Quantity + Add to cart */}
        <div className="mt-6 flex flex-col gap-4 border-t-2 border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-black text-foreground">
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
              <span className="font-mono text-xs uppercase text-muted-foreground">
                Inclusive of all taxes
              </span>
            </div>

            <div className="flex items-stretch border-2 border-border bg-card">
              <button
                type="button"
                onClick={() => {
                  setQuantity((q) => Math.max(1, q - 1));
                  setAddedToCart(false);
                }}
                aria-label="Decrease quantity"
                disabled={quantity <= 1 || isAdding}
                className={cn(
                  FOCUS,
                  "flex h-10 w-10 cursor-pointer items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                )}
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="flex h-10 w-10 items-center justify-center border-x-2 border-border font-mono text-sm font-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuantity((q) => Math.min(99, q + 1));
                  setAddedToCart(false);
                }}
                aria-label="Increase quantity"
                disabled={quantity >= 99 || isAdding}
                className={cn(
                  FOCUS,
                  "flex h-10 w-10 cursor-pointer items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                )}
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!image || isAdding}
              onClick={handleAddClick}
              className={cn(
                FOCUS,
                "group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 border-2 border-border bg-primary px-6 text-[13px] font-black uppercase tracking-[0.1em] text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
              )}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving to cart...
                </>
              ) : addedToCart ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Add another to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
                  Add to cart
                </>
              )}
            </button>

            {addedToCart && (
              <Link
                href="/cart"
                className={cn(
                  FOCUS,
                  "inline-flex h-12 w-full items-center justify-center gap-2 border-2 border-border bg-accent px-6 text-[13px] font-black uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)] sm:w-auto"
                )}
              >
                Proceed to cart
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            )}
          </div>

          {!image && (
            <p className="text-sm font-semibold text-muted-foreground">
              Add a photo to your poster in Step 01 to unlock Add to cart.
            </p>
          )}
        </div>
      </section>

      {/* ================= Photo Modal ================= */}
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

      {/* ================= Auth Modal (if signed out on Add to cart) ================= */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          createClient()
            .auth.getUser()
            .then(({ data }) => {
              if (data.user) {
                setAuthOpen(false);
                void submitAddToCart();
              }
            });
        }}
      />
    </div>
  );
}
