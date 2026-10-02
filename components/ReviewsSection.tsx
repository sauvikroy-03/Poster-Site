// components/ReviewsSection.tsx
"use client";
import React from "react";
import ReviewCard from "./ReviewCard";
import { Star } from "lucide-react";

interface Review {
  rating: number;
  quote: string;
  name: string;
  location: string;
}

const reviews: Review[] = [
  {
    rating: 5,
    quote:
      "The print quality genuinely surprised me. Deep blacks, zero banding, and the frame felt like something out of a gallery — not a marketplace.",
    name: "ANANYA RAO",
    location: "Bengaluru",
  },
  {
    rating: 5,
    quote:
      "Ordered four posters for my studio wall. Delivered in three days, packed in a rigid tube with corner guards. This is how it should be done.",
    name: "KABIR SETHI",
    location: "Mumbai",
  },
  {
    rating: 5,
    quote:
      "I've bought wall art online for years. Posterly is the first Indian brand that felt truly premium end to end, from the site to the unboxing.",
    name: "MEHER KAUR",
    location: "New Delhi",
  },
];

export default function ReviewsSection() {
  // Duplicate the list so the CSS animation can loop seamlessly
  const loopedReviews = [...reviews, ...reviews];

  return (
    // Steps to bg-muted to contrast with TrendingPosters' bg-background
    // border-b-2 ensures a consistent 2px separation before the next section/footer
    <section className="w-full overflow-hidden border-b-2 border-border bg-muted px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Eyebrow badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span>Customer Reviews</span>
        </div>

        {/* Heading */}
        <h2 className="mb-10 max-w-2xl text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:mb-14 sm:text-5xl lg:text-6xl">
          4.8 average from 2,400+ orders.
        </h2>
      </div>

      {/* Auto-scrolling row — full-bleed */}
      <div className="group relative w-full">
        <div className="flex w-max animate-marquee gap-6 group-hover:[animation-play-state:paused]">
          {loopedReviews.map((review, i) => (
            <ReviewCard
              key={`${review.name}-${i}`}
              rating={review.rating}
              quote={review.quote}
              name={review.name}
              location={review.location}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 24s linear infinite;
        }
      `}</style>
    </section>
  );
}