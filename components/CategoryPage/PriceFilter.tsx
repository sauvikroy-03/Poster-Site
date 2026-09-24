"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const MIN_PRICE = 0;
const MAX_PRICE = 1800;

export default function PriceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = Number(searchParams.get("maxPrice")) || MAX_PRICE;
  const [value, setValue] = useState(initial);

  // keep local slider in sync if URL changes externally (e.g. reset)
  useEffect(() => {
    setValue(Number(searchParams.get("maxPrice")) || MAX_PRICE);
  }, [searchParams]);

  const commitToUrl = useCallback(
    (val: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val >= MAX_PRICE) {
        params.delete("maxPrice");
      } else {
        params.set("maxPrice", String(val));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const percent = ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Max Price
      </span>

      <div className="w-full px-0.5">
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={50}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={() => commitToUrl(value)}
          onTouchEnd={() => commitToUrl(value)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-orange-500
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-orange-500"
          style={{
            background: `linear-gradient(to right, #f97316 ${percent}%, #e5e5e5 ${percent}%)`,
          }}
        />
      </div>

      <span className="text-xs text-neutral-500">
        Up to ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}