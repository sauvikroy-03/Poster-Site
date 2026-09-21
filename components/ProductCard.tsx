"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, Eye, ShoppingBag } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";

interface ProductCardProps {
  product: ProjectDataInterface;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { prod_name, prod_images, product_variants, prod_category } = product;

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

  const baseVariant = product_variants?.reduce((min, v) =>
    Number(v.prod_price) < Number(min.prod_price) ? v : min
  , product_variants[0]);

  const price = baseVariant ? Number(baseVariant.prod_price) : null;
  const comparePrice = baseVariant ? Number(baseVariant.compare_at_price) : null;
  const hasDiscount = comparePrice !== null && price !== null && comparePrice > price;

  // Extract unique available sizes
  const availableSizes = [
    ...new Set(
      product_variants
        ?.filter((v) => v.is_in_stock && v.prod_size)
        .map((v) => v.prod_size) ?? []
    ),
  ];

  const [selectedSize, setSelectedSize] = useState<string | null>(
    availableSizes[0] ?? null
  );

  const handleSelectSize = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: wire up cart logic — selectedSize holds the chosen size
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: wire up wishlist logic
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: wire up quick view modal
  };

  return (
    <div className="group flex h-full w-full flex-col border-2 border-black bg-[#f7f5f0] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-out hover:-translate-y-1.5">
      {/* Image frame */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-black/10">
          {/* Bestseller badge */}
          <span className="absolute left-2 top-2 z-10 border border-black bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-black sm:text-[10px]">
            Bestseller
          </span>

          {/* Wishlist + quick view — appear on hover */}
          {/* <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={handleWishlist}
              aria-label="Add to wishlist"
              className="flex h-7 w-7 items-center justify-center border border-black bg-white transition-colors hover:bg-black hover:text-white"
            >
              <Heart size={13} />
            </button>
            <button
              onClick={handleQuickView}
              aria-label="Quick view"
              className="flex h-7 w-7 items-center justify-center border border-black bg-white transition-colors hover:bg-black hover:text-white"
            >
              <Eye size={13} />
            </button>
          </div> */}

          <Image
            src={images[activeIndex]}
            alt={`${prod_name} - image ${activeIndex + 1}`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
          />

          {hasMultipleImages && (
            <>
              {/* Prev button */}
              <button
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-70 transition-opacity duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronLeft size={14} className="text-black" />
              </button>

              {/* Next button */}
              <button
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-70 transition-opacity duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight size={14} className="text-black" />
              </button>

              {/* Dots */}
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

      {/* Text block */}
      <div className="flex flex-1 flex-row items-start justify-between gap-2 border-t border-black/10 px-2.5 py-2 sm:gap-4 sm:px-4 sm:py-3">
        {/* Row 1: name (left) + price stack (right) */}
        <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-3">
          <h3
            title={prod_name}
            className="w-full truncate text-xs font-extrabold uppercase leading-tight text-black sm:text-sm md:text-base lg:text-lg"
          >
            {prod_name}
          </h3>

          <p
            title={prod_category}
            className="mt-1 w-full truncate text-[10px] font-semibold uppercase tracking-wide text-black/50 sm:text-xs"
          >
            {prod_category}
          </p>
        </div>

        {/* Row 2: price stack (right only) */}
<div className="flex flex-shrink-0 flex-col items-end leading-none">
  {price !== null && (
    <span className="whitespace-nowrap text-sm font-bold text-black sm:text-base md:text-lg">
      ₹{price.toLocaleString()}
    </span>
  )}
  {hasDiscount && (
    <span className="-mt-0.5 whitespace-nowrap text-[9px] font-bold text-black/40 line-through sm:-mt-1 sm:text-[10px] md:text-sm">
      ₹{comparePrice!.toLocaleString()}
    </span>
  )}
</div>

        {/* Selectable sizes — first one defaults to selected */}
        {/* {availableSizes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={(e) => handleSelectSize(e, size as string)}
                className={`min-w-[28px] border px-2 py-1 text-center text-[10px] font-semibold uppercase transition-colors sm:text-xs ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-black/30 bg-transparent text-black/70 hover:border-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )} */}

        {/* Add to cart */}
        {/* <button
          onClick={handleAddToCart}
          className="mt-3 flex w-full items-center justify-center gap-1.5 border-2 border-black bg-black py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-transform duration-200 ease-out hover:scale-105 sm:text-xs"
        >
          <ShoppingBag size={13} />
          Add to Cart
        </button> */}
      </div>
    </div>
  );
}