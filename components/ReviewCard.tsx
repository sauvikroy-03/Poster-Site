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
    <div className="flex w-[85vw] flex-shrink-0 flex-col border-2 border-border bg-card p-6 shadow-[5px_5px_0_0_var(--border)] sm:w-[45vw] sm:p-7 md:w-[380px] lg:w-[400px]">
      {/* Stars */}
      <div className="mb-4 flex gap-1" aria-label={`Rating: ${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const isFilled = i < rating;
          return (
            <Star
              key={i}
              size={16}
              className={
                isFilled
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted-foreground"
              }
              strokeWidth={1.5}
            />
          );
        })}
      </div>

      {/* Quote */}
      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
        &quot;{quote}&quot;
      </p>

      {/* Name + location */}
      <p className="text-sm font-extrabold uppercase tracking-tight text-foreground sm:text-base">
        {name}{" "}
        <span className="ml-1 text-sm font-medium normal-case text-muted-foreground/75 sm:text-base">
          / {location}
        </span>
      </p>
    </div>
  );
}