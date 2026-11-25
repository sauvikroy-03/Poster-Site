"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/components/Wishlist/WishlistProvider";
import type ProjectDataInterface from "@/types/ItemDetails";

interface ProductRatingSummary {
  avgRating: number;
  reviewCount: number;
}

interface WishlistGridProps {
  initialProducts: ProjectDataInterface[];
  isSignedIn: boolean;
  ratings?: Record<string, ProductRatingSummary>;
}

export default function WishlistGrid({
  initialProducts,
  isSignedIn,
  ratings = {},
}: WishlistGridProps) {
  const { wishlistedIds } = useWishlist();

  const visibleProducts = initialProducts.filter((product) =>
    wishlistedIds.has(product.prod_id)
  );

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-border bg-card px-6 py-16 text-center shadow-[4px_4px_0_0_var(--border)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-border bg-muted">
          <Heart className="h-6 w-6 text-foreground" strokeWidth={2.5} />
        </div>
        <h2 className="font-mono text-xl font-black uppercase text-foreground sm:text-2xl">
          Sign in to view your wishlist
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Log in to see the posters you have saved across devices.
        </p>
        <Link
          href="/categories"
          className="mt-6 border-2 border-border bg-primary px-6 py-3 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          Explore Posters
        </Link>
      </div>
    );
  }

  if (visibleProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-border bg-card px-6 py-16 text-center shadow-[4px_4px_0_0_var(--border)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-border bg-muted">
          <Heart className="h-6 w-6 text-foreground" strokeWidth={2.5} />
        </div>
        <h2 className="font-mono text-xl font-black uppercase text-foreground sm:text-2xl">
          Your wishlist is empty
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Tap the heart icon on any poster to save it here for later.
        </p>
        <Link
          href="/categories"
          className="mt-6 border-2 border-border bg-primary px-6 py-3 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "Saved Poster" : "Saved Posters"}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.prod_id}
            product={product}
            priority={index < 4}
            avgRating={ratings[product.prod_id]?.avgRating}
            reviewCount={ratings[product.prod_id]?.reviewCount}
          />
        ))}
      </div>
    </div>
  );
}