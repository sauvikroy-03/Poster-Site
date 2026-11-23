"use client";

import React from "react";

const SLIDER = [
  "h-7 w-full cursor-pointer appearance-none bg-transparent",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // Chrome and Safari
  "[&::-webkit-slider-runnable-track]:box-border [&::-webkit-slider-runnable-track]:h-7 [&::-webkit-slider-runnable-track]:border-2 [&::-webkit-slider-runnable-track]:border-border [&::-webkit-slider-runnable-track]:bg-muted",
  "[&::-webkit-slider-thumb]:box-border [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-accent",
  // Firefox
  "[&::-moz-range-track]:box-border [&::-moz-range-track]:h-7 [&::-moz-range-track]:border-2 [&::-moz-range-track]:border-border [&::-moz-range-track]:bg-muted",
  "[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-accent",
].join(" ");

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export default function RangeSlider({ label, value, min, max, step = 1, onChange }: RangeSliderProps) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={SLIDER}
    />
  );
}