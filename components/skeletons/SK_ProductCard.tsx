// components/ProductCardSkeleton.tsx
import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col border-2 border-border bg-card shadow-[6px_6px_0_0_var(--border)]">
      {/* Image frame — matches the real card's aspect-[5/6] block exactly */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[5/6] w-full border-2 border-border bg-muted">
          <div className="absolute inset-0 bg-foreground/5" />
        </div>
      </div>

      {/* Text block — same padding/gap rhythm as the real card */}
      <div className="flex items-start justify-between gap-2 border-t-2 border-border px-2.5 py-2 sm:gap-4 sm:px-4 sm:py-3">
        {/* Row 1: name + category placeholders */}
        <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-1.5">
          <div className="h-3 w-3/4 bg-muted sm:h-4" />
          <div className="h-2.5 w-1/2 bg-muted/70 sm:h-3" />
        </div>

        {/* Row 2: price placeholder */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <div className="h-3.5 w-12 bg-muted sm:h-4" />
        </div>
      </div>
    </div>
  );
}