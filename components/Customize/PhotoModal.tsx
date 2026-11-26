"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  RotateCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import FitFrame from "./FitFrame";
import ImageDropzone from "./ImageDropzone";
import PinterestInput from "./PinterestInput";
import RangeSlider from "./RangeSlider";
import {
  SPLIT_PIECES,
  clampFit,
  geometry,
  initialFit,
  loadPickedImage,
  posterRatio,
  printQuality,
  sliderToZoom,
  zoomToSlider,
  type Fit,
  type OrientationDef,
  type PickedImage,
  type SizeDef,
  type SplitGuide,
} from "./shared";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type Step = "source" | "fit";

interface PhotoModalProps {
  orientation: OrientationDef;
  split: SplitGuide | null;
  size: SizeDef;
  startStep: Step;
  /** The photo already saved, if any */
  image: PickedImage | null;
  fit: Fit;
  /** Fetches a pin and returns it as a file, or throws an Error with a friendly message */
  onResolvePin: (url: string) => Promise<File>;
  onCancel: () => void;
  onConfirm: (image: PickedImage, fit: Fit) => void;
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        FOCUS,
        "inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 border-2 border-border px-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground transition-colors",
        active ? "bg-accent shadow-[2px_2px_0_0_var(--border)]" : "bg-card hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "warn" | "bad";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "border-2 border-border p-3",
        tone === "bad" ? "bg-destructive/10 text-destructive" : "bg-accent text-foreground"
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{children}</p>
    </div>
  );
}

const labelClass = "font-mono text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground";

export default function PhotoModal({
  orientation,
  split,
  size,
  startStep,
  image,
  fit,
  onResolvePin,
  onCancel,
  onConfirm,
}: PhotoModalProps) {
  const [step, setStep] = useState<Step>(image ? startStep : "source");
  const [draft, setDraft] = useState<PickedImage | null>(image);
  const [draftFit, setDraftFit] = useState<Fit>(fit);
  const [error, setError] = useState("");
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const originalUrl = image?.url ?? null;

  const frameRatio = posterRatio(orientation.id, !!split);

  // A photo picked inside this modal is only ours until "Use photo" hands it to the page
  const discardDraft = () => {
    const d = draftRef.current;
    if (d && d.url !== originalUrl) URL.revokeObjectURL(d.url);
  };

  const acceptImage = (next: PickedImage) => {
    discardDraft();
    setDraft(next);
    setDraftFit(initialFit(next, frameRatio));
    setError("");
    setStep("fit");
  };

  const handleCancel = () => {
    discardDraft();
    onCancel();
  };

  const handleFile = async (file: File) => {
    setError("");
    try {
      acceptImage(await loadPickedImage(file, "upload"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  };

  const handlePin = async (pinUrl: string) => {
    const file = await onResolvePin(pinUrl);
    acceptImage(await loadPickedImage(file, "pinterest"));
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent className="max-h-[94dvh] overflow-y-auto rounded-none border-2 border-border bg-card p-5 text-foreground shadow-[6px_6px_0_0_var(--border)] sm:max-w-[600px] sm:p-7">
        <DialogTitle className="sr-only">
          {step === "source" || !draft ? "Add your photo" : "Fit your photo"}
        </DialogTitle>

        {step === "source" || !draft ? (
          /* ---------------- Step: choose a photo ---------------- */
          <div className="flex flex-col gap-5">
            <div>
              <p className={labelClass}>Add photo / {orientation.label}</p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-4xl">
                Pick a photo.
              </h2>
            </div>

            <div>
              <ImageDropzone compact onFile={handleFile} />
              {error && (
                <p role="alert" className="mt-3 text-sm font-bold text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4" aria-hidden="true">
              <span className="h-0.5 flex-1 bg-border" />
              <span className="border-2 border-border bg-accent px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                Or
              </span>
              <span className="h-0.5 flex-1 bg-border" />
            </div>

            <PinterestInput onResolve={handlePin} />

            {draft && (
              <button
                type="button"
                onClick={() => setStep("fit")}
                className={cn(
                  FOCUS,
                  "inline-flex cursor-pointer items-center gap-1.5 self-start font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to fitting
              </button>
            )}
          </div>
        ) : (
          /* ---------------- Step: fit the photo in the frame ---------------- */
          (() => {
            const g = geometry(draft, draftFit.turns, frameRatio);
            const sliderT = Math.min(1, Math.max(0, zoomToSlider(draftFit.zoom, g.maxZoom)));
            const q = printQuality(draft, draftFit, orientation, size, !!split);

            const setFitSafe = (next: Fit) => setDraftFit(clampFit(next, draft, frameRatio));

            return (
              <div className="flex flex-col gap-4">
                <div>
                  <p className={labelClass}>
                    {orientation.label} / {size.label}
                    {split && " / Split"}
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-4xl">
                    Fit your photo.
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    Drag to position. Pinch, scroll or slide to zoom.
                    {split && ` Dashed lines show where it is cut into ${SPLIT_PIECES} panels.`}
                  </p>
                </div>

                {q.level === "low" && (
                  <Notice tone="bad" title="Low quality photo">
                    At {size.label} this prints at about {q.dpi} dpi, so expect softness or blur. A
                    bigger original prints sharper.
                  </Notice>
                )}
                {q.level === "soft" && (
                  <Notice tone="warn" title="A little soft">
                    At {size.label} this prints at about {q.dpi} dpi. Fine for most walls, sharper
                    with a bigger original.
                  </Notice>
                )}
                {!q.covers && (
                  <Notice tone="warn" title="White borders will print">
                    Your photo doesn&apos;t cover the whole poster. Zoom in or tap Fill.
                  </Notice>
                )}

                <div className="bg-muted p-3 sm:p-4">
                  <FitFrame
                    image={draft}
                    fit={draftFit}
                    ratio={frameRatio}
                    split={split}
                    maxHeight="42dvh"
                    onFitChange={setDraftFit}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ToolButton
                    onClick={() =>
                      setDraftFit((f) =>
                        initialFit(draft, frameRatio, f.turns + (f.flip ? -1 : 1), f.flip)
                      )
                    }
                  >
                    <RotateCw className="h-4 w-4" strokeWidth={2.5} />
                    Rotate
                  </ToolButton>
                  <ToolButton
                    active={draftFit.flip}
                    onClick={() => setFitSafe({ ...draftFit, flip: !draftFit.flip })}
                  >
                    <FlipHorizontal className="h-4 w-4" strokeWidth={2.5} />
                    Flip
                  </ToolButton>
                  <ToolButton onClick={() => setFitSafe({ ...draftFit, zoom: 1, x: 0, y: 0 })}>
                    <Minimize2 className="h-4 w-4" strokeWidth={2.5} />
                    Fit
                  </ToolButton>
                  <ToolButton
                    onClick={() => setFitSafe({ ...draftFit, zoom: g.coverZoom, x: 0, y: 0 })}
                  >
                    <Maximize2 className="h-4 w-4" strokeWidth={2.5} />
                    Fill
                  </ToolButton>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between font-mono text-[11px] font-black uppercase tracking-[0.16em]">
                    <span className="text-muted-foreground">Zoom</span>
                    <span className="text-foreground">{draftFit.zoom.toFixed(1)}×</span>
                  </div>
                  <RangeSlider
                    label="Zoom"
                    min={0}
                    max={1}
                    step={0.001}
                    value={sliderT}
                    onChange={(t) => setFitSafe({ ...draftFit, zoom: sliderToZoom(t, g.maxZoom) })}
                  />
                </div>

                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Print check: ~{q.dpi} dpi at {size.label}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={cn(
                      FOCUS,
                      "h-12 cursor-pointer border-2 border-border bg-card px-4 text-[13px] font-black uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-muted"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfirm(draft, draftFit)}
                    className={cn(
                      FOCUS,
                      "h-12 cursor-pointer border-2 border-border bg-primary px-4 text-[13px] font-black uppercase tracking-[0.1em] text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
                    )}
                  >
                    {q.level === "low" ? "Use anyway" : "Use photo"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("source")}
                  className={cn(
                    FOCUS,
                    "inline-flex cursor-pointer items-center gap-1.5 self-start font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Choose a different photo
                </button>
              </div>
            );
          })()
        )}
      </DialogContent>
    </Dialog>
  );
}