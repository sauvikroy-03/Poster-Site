"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";
import Link from "next/link";
import Stars from "@/components/Utility/Stars";
import { useWishlist } from "@/components/Wishlist/WishlistProvider";

interface ProductCardProps {
  product: ProjectDataInterface;
  priority?: boolean;
  avgRating?: number;
  reviewCount?: number;
  variant?: "default" | "hero-side";
}

// 999 -> "999", 1000 -> "1k", 1250 -> "1.2k", 12000 -> "12k"
function formatCount(n: number) {
  if (n < 1000) return String(n);
  const k = Math.floor(n / 100) / 10; // truncate to one decimal, never round up
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

export default function ProductCard({
  product,
  priority = false,
  avgRating = 0,
  reviewCount = 0,
  variant = "default",
}: ProductCardProps) {
  const isHeroSide = variant === "hero-side";
  const {
    prod_id,
    prod_name,
    prod_images,
    prod_preview_image,
    product_variants,
    prod_category,
  } = product;

  const [activeIndex, setActiveIndex] = useState(0);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(prod_id);

  const images = prod_images?.length ? prod_images : ["/placeholder.png"];
  const previewImage = prod_preview_image?.trim() || images[0];
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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(prod_id);
  };

  const baseVariant = product_variants?.reduce(
    (min, v) => (Number(v.prod_price) < Number(min.prod_price) ? v : min),
    product_variants[0]
  );

  const price = baseVariant ? Number(baseVariant.prod_price) : null;
  const comparePrice = baseVariant ? Number(baseVariant.compare_at_price) : null;
  const hasDiscount = comparePrice !== null && price !== null && comparePrice > price;

  return (
    <Link
      href={`/product/${product.prod_slug}`}
      className="group flex w-full flex-col overflow-hidden border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)] transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:cursor-pointer"
    >
      {/* Image frame: Locks to 3/4 or 4/5 proportional aspect ratio with neutral containment background */}
      <div className={isHeroSide ? "p-2 pb-1.5" : "p-2 pb-1.5 sm:p-3 sm:pb-2"}>
        <div
          className={`relative w-full overflow-hidden border-2 border-border/20 bg-muted ${
            isHeroSide ? "aspect-[5/6] lg:aspect-[5/4]" : "aspect-[5/6]"
          }`}
        >
          {/* Bestseller badge */}
          {/* <span className="absolute left-2 top-2 z-10 border-2 border-border bg-background px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-foreground shadow-[1px_1px_0_0_var(--border)] sm:text-[10px]">
            Bestseller
          </span> */}

          {/* Wishlist button */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={liked}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center border-2 border-border bg-background text-foreground shadow-[1px_1px_0_0_var(--border)] transition-transform duration-150 hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:h-8 sm:w-8"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${
                liked ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
              strokeWidth={2.5}
            />
          </button>

          <Image
            src={previewImage}
            alt={`${prod_name} - preview`}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
          />

          {/* {hasMultipleImages && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 border-2 border-border bg-card p-1 opacity-70 transition-opacity duration-200 hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronLeft size={14} className="text-foreground" />
              </button>

              <button
                onClick={goNext}
                aria-label="Next image"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 border-2 border-border bg-card p-1 opacity-70 transition-opacity duration-200 hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight size={14} className="text-foreground" />
              </button>

              <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 border border-border transition-colors ${
                      i === activeIndex ? "bg-primary" : "bg-card/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )} */}
        </div>
      </div>

      {/* Text block: Content naturally determines bottom height */}
      <div
        className={`flex items-start justify-between gap-2 border-t-2 border-border/15 ${
          isHeroSide
            ? "px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
            : "px-2.5 py-2 sm:gap-4 sm:px-4 sm:py-3"
        }`}
      >
        {/* Row 1: name (left) + category + rating */}
        <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-1">
          <h3
            title={prod_name}
            className={`w-full font-black uppercase leading-tight text-foreground ${
              isHeroSide
                ? "line-clamp-2 text-xs sm:text-sm"
                : "truncate text-xs sm:text-sm md:text-base lg:text-lg"
            }`}
          >
            {prod_name}
          </h3>

          <p
            title={prod_category}
            className="w-full truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs"
          >
            {prod_category}
          </p>

          {reviewCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <Stars rating={avgRating} size={14} />
              <span className="text-[10px] font-bold text-muted-foreground sm:text-xs">
                ({formatCount(reviewCount)})
              </span>
            </div>
          ) : (
            !isHeroSide && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
                No ratings yet
              </span>
            )
          )}
        </div>

        {/* Row 2: price stack */}
        <div className="flex flex-shrink-0 flex-col items-end leading-none">
          {price !== null && (
            <span
              className={`whitespace-nowrap font-black text-foreground ${
                isHeroSide ? "text-sm sm:text-base" : "text-sm sm:text-base md:text-lg"
              }`}
            >
              ₹{price.toLocaleString()}
            </span>
          )}
          {hasDiscount && (
            <span className="-mt-0.5 whitespace-nowrap text-[9px] font-bold text-muted-foreground line-through sm:-mt-1 sm:text-[10px] md:text-sm">
              ₹{comparePrice!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}