"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function OfferBarContent({
  code,
  description,
}: {
  code: string;
  description: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the code is still visible, so just ignore
    }
  };

  return (
    <div className="w-full border-b-2 border-border bg-accent text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 font-mono font-bold uppercase tracking-wider">
        {description && (
          <span className="max-w-[70vw] truncate text-center text-[9px] sm:max-w-none sm:truncate-none sm:text-[11px] md:text-xs">
            {description}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy coupon code ${code}`}
          className="flex cursor-pointer items-center gap-1.5 border-2 border-dashed border-primary-foreground px-2 py-0.5 text-[9px] font-black transition-opacity hover:opacity-80 sm:text-[11px] md:text-xs"
        >
          {code}
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}