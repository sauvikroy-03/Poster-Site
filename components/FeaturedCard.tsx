"use client";
import React from "react";
import Image from "next/image";
import { CategoryInterface } from "@/types/categoryDetails";
import placeholderImg from "@/public/placeholder.jpg";

interface categoriesProps {
  category: CategoryInterface;
}

export default function FeaturedCard({ category }: categoriesProps) {
  const { category_name } = category;

  return (
    <div className="group flex h-full w-full flex-col border-2 border-black bg-[#f7f5f0] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-out hover:-translate-y-1.5 sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:cursor-pointer">
      {/* Image frame */}
      <div className="p-2 pb-1.5 sm:p-3 sm:pb-2">
        <div className="relative aspect-[5/6] w-full overflow-hidden border border-black/10">
          <Image
            src={placeholderImg}
            alt="CategoryImage"
            fill
            className="object-cover md:grayscale transition-all duration-500 ease-out group-hover:scale-110 group-hover:grayscale-0"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
          />
        </div>
      </div>

      {/* Text block — flex-1 so it fills remaining height evenly across cards */}
      <div className="flex flex-1 flex-col border-t border-black/10 px-2.5 py-2 sm:px-4 sm:py-3">
        <h3 className="mt-1 line-clamp-2 min-h-[2.4em] text-xs font-extrabold uppercase leading-tight text-black sm:text-sm md:text-base lg:text-lg">
          {category_name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2"></div>
      </div>
    </div>
  );
}