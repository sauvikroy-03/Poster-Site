// app/account/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10 md:flex-row md:gap-14 md:py-14">
        {/* Sidebar Skeleton */}
        <aside className="w-full shrink-0 md:w-60">
          <div className="h-11 w-full animate-pulse border-2 border-border bg-muted shadow-[4px_4px_0_0_var(--border)] md:h-52" />
        </aside>

        {/* Panel Content Skeleton */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header Bar */}
          <div className="h-8 w-48 animate-pulse border-2 border-border bg-muted" />

          {/* Cards */}
          <div className="h-32 w-full animate-pulse border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]" />
          <div className="h-56 w-full animate-pulse border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]" />
        </div>
      </div>
    </div>
  );
}