// app/categories/loading.tsx
import React from "react";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
      {/* Skeleton for CategoryHero */}
      <div className="w-full border-b-2 border-black bg-[#eeece7] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 h-10 w-64 animate-pulse rounded bg-neutral-300" />
          <div className="h-5 w-96 animate-pulse rounded bg-neutral-300" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-4">
          {/* Aside Skeleton */}
          <aside className="col-span-1 flex flex-col gap-6">
            <div className="h-10 w-full animate-pulse rounded-full bg-neutral-200" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-24 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-8 w-28 animate-pulse rounded-full bg-neutral-200" />
              </div>
            </div>
          </aside>

          {/* Grid Skeleton */}
          <main className="col-span-1 md:col-span-3">
            <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}