// components/FeaturedCardSkeleton.tsx
import React from "react";

export default function FeaturedCardSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col border-2 border-black bg-[#f7f5f0] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Image frame — matches FeaturedCard's aspect-[4/5] block exactly */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[5/6] w-full overflow-hidden border border-black/10 bg-black/10" />
      </div>

      {/* Text block — same padding/flex-1 as the real card */}
      <div className="flex flex-1 flex-col border-t border-black/10 px-2.5 py-2 sm:px-4 sm:py-3">
        <div className="mt-1 h-[2.4em] w-3/4 space-y-1.5">
          <div className="h-3 w-full bg-black/10 sm:h-4" />
   
        </div>
   
      </div>
    </div>
  );
}