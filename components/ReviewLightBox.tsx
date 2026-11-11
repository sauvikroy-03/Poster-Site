"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ReviewLightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const BTN =
  "absolute flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function ReviewLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: ReviewLightboxProps) {
  const hasMany = images.length > 1;
  const prev = () => onIndexChange(index === 0 ? images.length - 1 : index - 1);
  const next = () => onIndexChange(index === images.length - 1 ? 0 : index + 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (hasMany && e.key === "ArrowLeft") prev();
      if (hasMany && e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock page scroll while open

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review photo"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative h-[80vh] w-full max-w-3xl border-2 border-border bg-card"
      >
        <Image
          src={images[index]}
          alt={`Review photo ${index + 1} of ${images.length}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`${BTN} right-2 top-2`}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {hasMany && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className={`${BTN} left-2 top-1/2 -translate-y-1/2`}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className={`${BTN} right-2 top-1/2 -translate-y-1/2`}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}