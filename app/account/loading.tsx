// app/account/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 md:flex-row md:gap-14 md:py-14">
        {/* Sidebar Skeleton */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200 md:h-48" />
        </aside>

        {/* Panel Content Skeleton */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-neutral-100 border border-neutral-200" />
          <div className="h-48 w-full animate-pulse rounded-lg bg-neutral-100 border border-neutral-200" />
        </div>
      </div>
    </div>
  );
}