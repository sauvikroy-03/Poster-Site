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

  // Keep local slider in sync if URL changes externally
  useEffect(() => {
    const urlValue = Number(searchParams.get("maxPrice")) || MAX_PRICE;
    setValue((prev) => (prev === urlValue ? prev : urlValue));
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
    <div className="flex w-full flex-col items-start gap-2.5">
      <span className="font-mono text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        MAX PRICE
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
          className="h-2 w-full cursor-pointer appearance-none border-2 border-border bg-muted
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border
            [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[2px_2px_0_0_var(--border)]
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-none
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border
            [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-[2px_2px_0_0_var(--border)]"
          style={{
            background: `linear-gradient(to right, var(--accent) ${percent}%, var(--muted) ${percent}%)`,
          }}
        />
      </div>

      <div className="flex w-full items-center justify-between font-mono text-xs font-bold text-foreground">
        <span className="text-[11px] text-muted-foreground">UP TO</span>
        <span className="border border-border bg-card px-1.5 py-0.5 shadow-[2px_2px_0_0_var(--border)]">
          ₹{value.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}