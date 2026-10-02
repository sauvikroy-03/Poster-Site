// app/categories/loading.tsx
import React from "react";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Category Hero Banner Skeleton */}
      <div className="w-full border-b-2 border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 h-10 w-64 animate-pulse border-2 border-border bg-muted shadow-[3px_3px_0_0_var(--border)]" />
          <div className="h-5 w-96 max-w-full animate-pulse border-2 border-border bg-muted/70 shadow-[2px_2px_0_0_var(--border)]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-4">
          {/* Aside Sidebar Skeleton */}
          <aside className="col-span-1 flex flex-col gap-6">
            {/* Search Input Box Skeleton */}
            <div className="h-11 w-full animate-pulse border-2 border-border bg-card shadow-[3px_3px_0_0_var(--border)]" />

            {/* Filter Section Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="h-4 w-24 animate-pulse border border-border bg-muted" />
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-24 animate-pulse border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]" />
                <div className="h-8 w-28 animate-pulse border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]" />
                <div className="h-8 w-20 animate-pulse border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]" />
              </div>
            </div>
          </aside>

          {/* Product Grid Skeleton */}
          <main className="col-span-1 md:col-span-3">
            {/* Header / Sort Row Skeleton */}
            <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-4">
              <div className="h-5 w-24 animate-pulse border border-border bg-muted" />
              <div className="h-8 w-36 animate-pulse border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]" />
            </div>

            {/* Product Cards Grid */}
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
