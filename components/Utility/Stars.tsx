import React from "react";
import { Star } from "lucide-react";

interface StarsProps {
  /** 0 to max. Decimals work too (e.g. 4.3 partially fills the 5th star). */
  rating?: number;
  max?: number;
  /** Star size in px */
  size?: number;
  className?: string;
}

export default function Stars({ rating = 5, max = 5, size = 16, className = "" }: StarsProps) {
  const safeRating = Math.min(Math.max(rating, 0), max);

  return (
    <span
      role="img"
      aria-label={`Rated ${safeRating} out of ${max}`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: max }, (_, i) => {
        // 0 to 100: how much of this star is filled
        const fillPercent = Math.min(Math.max(safeRating - i, 0), 1) * 100;

        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            {/* Empty star (base layer) */}
            <Star
              width={size}
              height={size}
              strokeWidth={2.5}
              className="absolute inset-0 fill-transparent text-foreground"
              aria-hidden="true"
            />
            {/* Filled star, clipped to the fill percentage */}
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star
                width={size}
                height={size}
                strokeWidth={2.5}
                className="fill-accent text-foreground"
                style={{ minWidth: size }}
                aria-hidden="true"
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}