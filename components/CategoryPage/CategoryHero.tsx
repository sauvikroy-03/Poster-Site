import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CategoryHero() {
  return (
    // Uses bg-muted (deeper oatmeal paper) bounded by a uniform 2px black bottom border
    <div className="w-full border-b-2 border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <ChevronRight size={14} className="text-muted-foreground" strokeWidth={2.5} />
          <span className="text-foreground">Categories</span>
        </div>

        {/* Eyebrow badge with mini brutalist shadow */}
        <div className="inline-flex items-center gap-1.5 text-xl   px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground ">
          
          <span>The Collection</span>
        </div>

        {/* Headline */}
        <h1 className="mt-4 text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Every wall deserves better.
        </h1>

        {/* Subtext */}
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          1,200+ designs, printed to order on archival stock. Filter your way
          to the one.
        </p>
      </div>
    </div>
  );
}