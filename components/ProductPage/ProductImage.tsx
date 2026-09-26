"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";

interface ProductCardProps {
  product: ProjectDataInterface;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { prod_name, prod_images } = product;

  const [activeIndex, setActiveIndex] = useState(0);

  const images = prod_images?.length ? prod_images : ["/placeholder.png"];
  const hasMultipleImages = images.length > 1;

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

  return (
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
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-130"
            sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
          />

          {hasMultipleImages && (
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
          )}
        </div>
      </div>
    </div>
  );
}