"use client";

import React, { useState } from "react";
import Image from "next/image";
import ReviewCard from "./ReviewCard";
import ReviewLightbox from "./ReviewLightBox";
import type { PublicReview } from "@/lib/store-reviews";

const MIN_ITEMS = 8; // enough tiles to fill wide screens before looping

function MarqueeRow({
  items,
  reverse = false,
  secondsPerItem,
}: {
  items: React.ReactNode[];
  reverse?: boolean; // false = moves right to left, true = moves left to right
  secondsPerItem: number;
}) {
  if (items.length === 0) return null;

  const base =
    items.length >= MIN_ITEMS
      ? items
      : Array.from({ length: Math.ceil(MIN_ITEMS / items.length) }, () => items).flat();
  const looped = [...base, ...base];

  return (
    <>
      <div className="group relative w-full">
        <div
          className={`marquee flex w-max ${reverse ? "to-right" : "to-left"} `}
          style={{ animationDuration: `${base.length * secondsPerItem}s` }}
        >
          {/* pr-6 on each item (instead of flex gap) keeps the -50% loop point exact */}
          {looped.map((node, i) => (
            <div key={i} className="flex-shrink-0 pr-6">
              {node}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes to-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes to-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .marquee {
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .to-left { animation-name: to-left; }
        .to-right { animation-name: to-right; }
        @media (prefers-reduced-motion: reduce) {
          .marquee { animation: none; }
        }
      `}</style>
    </>
  );
}

export default function ReviewsMarquee({ reviews }: { reviews: PublicReview[] }) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Top row: every photo from every review, as square tiles
  const photoTiles = reviews.flatMap((r) =>
    (r.images ?? []).map((src, index) => (
      <button
        key={`${r.id}-${index}`}
        type="button"
        onClick={() => setLightbox({ images: r.images!, index })}
        aria-label={`View photo from ${r.name}`}
        className="relative block aspect-square w-[240px] cursor-pointer overflow-hidden border-2 border-border bg-muted shadow-[5px_5px_0_0_var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-[280px]"
      >
        <Image
          src={src}
          alt={`Photo from ${r.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 240px, 280px"
        />
      </button>
    ))
  );

  // Bottom row: written reviews as square cards
  const textCards = reviews
    .filter((r) => r.quote?.trim())
    .map((r) => (
      <ReviewCard
        key={r.id}
        rating={r.rating}
        quote={r.quote}
        name={r.name}
        location={r.location}
        date={r.date}
      />
    ));

  return (
    <>
      {/* py-2 so the hard shadows don't get clipped by overflow */}
      <div className="flex flex-col gap-6 py-2">
        <MarqueeRow items={photoTiles} reverse secondsPerItem={6} />
        <MarqueeRow items={textCards} secondsPerItem={6} />
      </div>

      {lightbox && (
        <ReviewLightbox
          images={lightbox.images}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox((l) => (l ? { ...l, index } : l))}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}