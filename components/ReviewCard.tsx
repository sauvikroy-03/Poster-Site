// components/ReviewCard.tsx
"use client";
import React from "react";
import { Star } from "lucide-react";

interface ReviewCardProps {
  rating: number;
  quote: string;
  name: string;
  location: string;
}

export default function ReviewCard({
  rating,
  quote,
  name,
  location,
}: ReviewCardProps) {
  return (
    <div className="flex w-[85vw] flex-shrink-0 flex-col border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:w-[45vw] sm:p-7 md:w-[380px] lg:w-[400px]">
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className="fill-black text-black"
            strokeWidth={0}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="mb-6 flex-1 text-sm leading-relaxed text-black/80 sm:text-base">
        &quot;{quote}&quot;
      </p>

      {/* Name + location */}
      <p className="text-sm font-extrabold uppercase text-black sm:text-base">
        {name}{" "}
        <span className="ml-1 text-sm font-medium normal-case text-black/50 sm:text-base">
          {location}
        </span>
      </p>
    </div>
  );
}