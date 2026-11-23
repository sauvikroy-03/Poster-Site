"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { clampFit, geometry, type Fit, type SplitGuide } from "./shared";

/* ---------- Cut lines for split posters ---------- */

function SplitLines({ split, variant }: { split: SplitGuide; variant: "dashed" | "solid" }) {
  const vertical = split.lines === "vertical";
  return (
    <>
      {Array.from({ length: split.pieces - 1 }, (_, i) => {
        const pos = `${((i + 1) / split.pieces) * 100}%`;
        const place = vertical ? { left: pos } : { top: pos };
        return variant === "dashed" ? (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute border-dashed border-white mix-blend-difference",
              vertical ? "inset-y-0 border-l-2" : "inset-x-0 border-t-2"
            )}
            style={place}
          />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute bg-white/85 shadow-[0_0_3px_rgba(0,0,0,0.45)]",
              vertical ? "inset-y-0 w-[2px] -translate-x-1/2" : "inset-x-0 h-[2px] -translate-y-1/2"
            )}
            style={place}
          />
        );
      })}
    </>
  );
}

/* ---------- The frame: poster-shaped box ---------- */

interface FrameShellProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio: number;
  split?: SplitGuide | null;
  guideStyle?: "dashed" | "solid";
  /** Caps the frame height (any CSS length, e.g. "44dvh"). The width follows from the ratio. */
  maxHeight?: string;
  /** No border, shadow or width cap: fills its parent (used on the wall) */
  plain?: boolean;
  /** Classes for the outer bordered box */
  frameClassName?: string;
}

export const FrameShell = forwardRef<HTMLDivElement, FrameShellProps>(function FrameShell(
  {
    ratio,
    split,
    guideStyle = "dashed",
    maxHeight,
    plain = false,
    frameClassName,
    className,
    style,
    children,
    ...rest
  },
  ref
) {
  // container-type lets the photo size itself in "frame widths" (cqw), so it scales with the frame
  const inner = (
    <div
      ref={ref}
      {...rest}
      className={cn("relative w-full overflow-hidden bg-white [container-type:inline-size]", className)}
      style={{ aspectRatio: String(ratio), ...style }}
    >
      {children}
      {split && <SplitLines split={split} variant={guideStyle} />}
    </div>
  );

  if (plain) return inner;

  return (
    <div
      className={cn("mx-auto border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]", frameClassName)}
      style={{ width: maxHeight ? `min(100%, calc(${maxHeight} * ${ratio}))` : "100%" }}
    >
      {inner}
    </div>
  );
});

/* ---------- The photo inside the frame ---------- */

interface FitFrameProps {
  image: { url: string; width: number; height: number; name?: string };
  fit: Fit;
  ratio: number;
  split?: SplitGuide | null;
  guideStyle?: "dashed" | "solid";
  maxHeight?: string;
  plain?: boolean;
  /** Pass this to make the frame draggable and zoomable. Leave it out for a static preview. */
  onFitChange?: (fit: Fit) => void;
  frameClassName?: string;
}

export default function FitFrame({
  image,
  fit,
  ratio,
  split,
  guideStyle,
  maxHeight,
  plain,
  onFitChange,
  frameClassName,
}: FitFrameProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef(fit);
  const changeRef = useRef(onFitChange);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const interactive = !!onFitChange;
  const imgW = image.width;
  const imgH = image.height;

  useEffect(() => {
    fitRef.current = fit;
  }, [fit]);
  useEffect(() => {
    changeRef.current = onFitChange;
  }, [onFitChange]);

  // Always clamp, and keep the ref current so rapid pointer events don't lose movement
  const apply = (next: Fit) => {
    const clamped = clampFit(next, { width: imgW, height: imgH }, ratio);
    fitRef.current = clamped;
    changeRef.current?.(clamped);
  };

  // Mouse wheel zoom (needs a native listener so we can stop the page from scrolling)
  useEffect(() => {
    const el = shellRef.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = fitRef.current;
      const next = clampFit(
        { ...f, zoom: f.zoom * Math.exp(-e.deltaY * 0.0015) },
        { width: imgW, height: imgH },
        ratio
      );
      fitRef.current = next;
      changeRef.current?.(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [interactive, imgW, imgH, ratio]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: fitRef.current.zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 1) {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const f = fitRef.current;
      // Offsets are stored in frame widths, so both axes divide by the frame's width
      apply({ ...f, x: f.x + (cur.x - prev.x) / rect.width, y: f.y + (cur.y - prev.y) / rect.width });
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      apply({ ...fitRef.current, zoom: pinch.current.zoom * (dist / pinch.current.dist) });
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const f = fitRef.current;
    const step = 0.02;
    switch (e.key) {
      case "ArrowLeft":
        apply({ ...f, x: f.x - step });
        break;
      case "ArrowRight":
        apply({ ...f, x: f.x + step });
        break;
      case "ArrowUp":
        apply({ ...f, y: f.y - step });
        break;
      case "ArrowDown":
        apply({ ...f, y: f.y + step });
        break;
      case "+":
      case "=":
        apply({ ...f, zoom: f.zoom * 1.1 });
        break;
      case "-":
      case "_":
        apply({ ...f, zoom: f.zoom / 1.1 });
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const g = geometry(image, fit.turns, ratio);
  const widthInFrames = imgW * g.containScale * fit.zoom; // photo width before rotation, in frame widths

  return (
    <FrameShell
      ref={shellRef}
      ratio={ratio}
      split={split}
      guideStyle={guideStyle}
      maxHeight={maxHeight}
      plain={plain}
      frameClassName={frameClassName}
      role={interactive ? "application" : "img"}
      aria-label={
        interactive
          ? "Photo position. Drag to move it, use plus and minus to zoom."
          : `Preview of ${image.name ?? "your photo"} on the poster`
      }
      tabIndex={interactive ? 0 : undefined}
      className={
        interactive
          ? "cursor-grab touch-none active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          : undefined
      }
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? endPointer : undefined}
      onPointerCancel={interactive ? endPointer : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
        style={{
          width: `calc(${widthInFrames} * 100cqw)`,
          height: "auto",
          // Move first, then mirror, then rotate: Flip always mirrors what you see
          transform: `translate(calc(-50% + ${fit.x} * 100cqw), calc(-50% + ${fit.y} * 100cqw)) scaleX(${fit.flip ? -1 : 1}) rotate(${fit.turns * 90}deg)`,
        }}
      />
    </FrameShell>
  );
}