// components/FeaturedCardSkeleton.tsx
import React from "react";

export default function FeaturedCardSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col border-2 border-border bg-card shadow-[5px_5px_0_0_var(--border)] sm:shadow-[6px_6px_0_0_var(--border)]">
      {/* Image frame — matches FeaturedCard's image block */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[5/6] w-full border-2 border-border bg-muted" />
      </div>

      {/* Text block — same padding/flex-1 as the real card */}
      <div className="flex flex-1 flex-col border-t-2 border-border px-2.5 py-2 sm:px-4 sm:py-3">
        <div className="mt-1 h-[2.4em] w-3/4 space-y-2">
          <div className="h-3 w-full bg-muted sm:h-4" />
          <div className="h-2.5 w-1/2 bg-muted/70 sm:h-3" />
        </div>
      </div>
    </div>
  );
}