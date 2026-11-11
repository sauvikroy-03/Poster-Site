import React from "react";
import { Star } from "lucide-react";
import ReviewsMarquee from "@/components/ReviewsMarquee";
import { getPublicReviews } from "@/lib/store-reviews";

export default async function ReviewsSection() {
  const { reviews, avgRating, reviewCount } = await getPublicReviews();

  // No real reviews yet: hide the section instead of showing fake numbers
  if (reviews.length === 0) return null;

  return (
    <section className="w-full overflow-hidden border-b-2 border-border bg-muted px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Eyebrow badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span>Customer Reviews</span>
        </div>

        {/* Heading */}
        <h2 className="mb-10 max-w-2xl text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:mb-14 sm:text-5xl lg:text-6xl">
          {avgRating.toFixed(1)} average from {reviewCount.toLocaleString("en-IN")}{" "}
          {reviewCount === 1 ? "review" : "reviews"}.
        </h2>
      </div>

      <ReviewsMarquee reviews={reviews} />
    </section>
  );
}