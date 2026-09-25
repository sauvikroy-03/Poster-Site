import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CategoryHero() {
  return (
    <div className="w-full border-b border-neutral-200 bg-[#fbfaf8]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1.5 text-sm">
          <Link
            href="/"
            className="text-neutral-500 transition-colors hover:text-black"
          >
            Home
          </Link>
          <ChevronRight size={14} className="text-neutral-400" />
          <span className="font-semibold text-black">Categories</span>
        </div>

        {/* Eyebrow */}
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          The Collection
        </span>

        {/* Headline */}
        <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight text-black sm:text-6xl">
          Every wall deserves better.
        </h1>

        {/* Subtext */}
        <p className="mt-4 text-base text-neutral-500 sm:text-lg">
          1,200+ designs, printed to order on archival stock. Filter your way
          to the one.
        </p>
      </div>
    </div>
  );
}