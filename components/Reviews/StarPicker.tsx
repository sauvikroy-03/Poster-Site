"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
  label?: string;
}

export default function StarPicker({
  value,
  onChange,
  size = 28,
  disabled = false,
  label = "Rating",
}: StarPickerProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(n)}
          onClick={() => onChange(n)}
          className="cursor-pointer p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <Star
            width={size}
            height={size}
            strokeWidth={2.5}
            className={
              n <= shown
                ? "fill-accent text-foreground"
                : "fill-transparent text-foreground"
            }
          />
        </button>
      ))}
    </div>
  );
}