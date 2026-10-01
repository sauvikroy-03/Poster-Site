"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";

interface ProductCardProps {
  product: ProjectDataInterface;
}

export default function ProductImage({ product }: ProductCardProps) {
  const { prod_name, prod_images } = product;

  const [activeIndex, setActiveIndex] = useState(0);
  const thumbTrackRef = useRef<HTMLDivElement>(null);

  const images = prod_images?.length ? prod_images : ["/placeholder.png"];
  const hasMultipleImages = images.length > 1;
  const hasOverflowThumbs = images.length > 4;

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const scrollThumbs = (direction: "left" | "right") => {
    const track = thumbTrackRef.current;
    if (!track) return;

    const thumb = track.querySelector<HTMLButtonElement>("[data-thumb]");
    const thumbWidth = thumb ? thumb.offsetWidth + 12 : 96; // + gap

    track.scrollBy({
      left: direction === "left" ? -thumbWidth * 2 : thumbWidth * 2,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Main image */}
      <div className="group relative w-full overflow-hidden border-2 border-black bg-[#f7f5f0] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-out hover:cursor-pointer">
        <div className="p-2 sm:p-3">
          <div className="relative aspect-[5/6] w-full overflow-hidden border border-black/10 bg-[#eeece7]">
            {/* Bestseller badge */}
            <span className="absolute left-2 top-2 z-10 border border-black bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-black sm:text-[10px]">
              Bestseller
            </span>

            <Image
              src={images[activeIndex]}
              alt={`${prod_name} - image ${activeIndex + 1}`}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-125"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
            />

            {/* {hasMultipleImages && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-70 transition-opacity duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronLeft size={14} className="text-black" />
                </button>

                <button
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-70 transition-opacity duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronRight size={14} className="text-black" />
                </button>

                <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 w-1 rounded-full transition-colors ${
                        i === activeIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )} */}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="relative flex items-center gap-2">
          {hasOverflowThumbs && (
            <button
              type="button"
              onClick={() => scrollThumbs("left")}
              aria-label="Scroll thumbnails left"
              className="flex h-9 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 shadow-sm transition-colors hover:border-black hover:text-black"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          <div
            ref={thumbTrackRef}
            className="flex flex-1 gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => {
              const isActive = i === activeIndex;
              return (
                <button
  key={i}
  data-thumb
  type="button"
  onClick={() => setActiveIndex(i)}
  aria-label={`View image ${i + 1}`}
  className={`flex-shrink-0 overflow-hidden border-2 bg-[#f7f5f0] transition-transform duration-200 ease-out ${
    isActive ? "-translate-y-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" : "hover:-translate-y-0.5 cursor-pointer"
  }`}
>
  <div className="p-1 sm:p-1.5">
    <div className="relative aspect-square w-16 overflow-hidden border border-black/10 sm:w-20 md:w-24">
      <Image
        src={img}
        alt={`${prod_name} thumbnail ${i + 1}`}
        fill
        className="object-cover"
        sizes="96px"
      />
    </div>
  </div>
</button>
              );
            })}
          </div>

          {hasOverflowThumbs && (
            <button
              type="button"
              onClick={() => scrollThumbs("right")}
              aria-label="Scroll thumbnails right"
              className="flex h-9 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 shadow-sm transition-colors hover:border-black hover:text-black"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}