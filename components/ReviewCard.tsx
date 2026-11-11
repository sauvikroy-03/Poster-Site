"use client";
import React from "react";
import { Star } from "lucide-react";

interface ReviewCardProps {
  rating: number;
  quote: string;
  name: string;
  location: string;
  date: string;
}

export default function ReviewCard({
  rating,
  quote,
  name,
  location,
  date,
}: ReviewCardProps) {
  return (
    <div className="flex aspect-square w-[240px] flex-shrink-0 flex-col border-2 border-border bg-card p-5 shadow-[5px_5px_0_0_var(--border)] sm:w-[280px]">
      {/* Stars + date */}
      <div className="mb-3 flex flex-shrink-0 items-center justify-between gap-3">
        <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={
                i < rating
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted-foreground"
              }
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground/75">{date}</span>
      </div>

      {/* Quote fills the remaining space and clamps with an ellipsis */}
      <div className="mb-3 min-h-0 flex-1 overflow-hidden">
        <p
          title={quote}
          className="line-clamp-5 text-sm leading-relaxed text-muted-foreground sm:line-clamp-6"
        >
          &quot;{quote}&quot;
        </p>
      </div>

      {/* Name + location */}
      <p className="flex-shrink-0 truncate text-sm font-bold uppercase tracking-tight text-foreground">
        {name}
        {location && (
          <span className="ml-1 text-sm font-medium normal-case text-muted-foreground/75">
            / {location}
          </span>
        )}
      </p>
    </div>
  );
}