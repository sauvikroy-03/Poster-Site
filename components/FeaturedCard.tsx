// components/FeaturedCard.tsx
import React from "react";
import Image from "next/image";
import { CategoryInterface } from "@/types/categoryDetails";
import placeholderImg from "@/public/placeholder.jpg";
import Link from "next/link";

interface categoriesProps {
  category: CategoryInterface;
}

export default function FeaturedCard({ category }: categoriesProps) {
  const { category_name, slug } = category;

  return (
    <Link
      href={`/categories?category=${slug}`}
      prefetch={true}
      className="group flex h-full w-full flex-col border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)] transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:cursor-pointer"
    >
      {/* Image frame */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[5/6] w-full overflow-hidden border-2 border-border/20 bg-muted">
          <Image
            src={placeholderImg}
            alt={category_name || "CategoryImage"}
            fill
            className="object-cover transition-all duration-500 ease-out md:grayscale group-hover:scale-110 group-hover:grayscale-0"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
          />
        </div>
      </div>

      {/* Text block */}
      <div className="flex flex-1 flex-col border-t-2 border-border/15 px-2.5 py-2 sm:px-4 sm:py-3">
        <h3 className="mt-1 line-clamp-2 min-h-[2.4em] text-xs font-black uppercase leading-tight text-foreground sm:text-sm md:text-base lg:text-lg">
          {category_name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2"></div>
      </div>
    </Link>
  );
}