import { ArrowRight } from "lucide-react";
import { CategoryInterface } from "@/types/categoryDetails";
import FeaturedCard from "./FeaturedCard";
import FeaturedCardSkeleton from "./skeletons/SK_FeaturedCard";
import Link from "next/link";

interface FeaturedCategoriesProps {
  initialCategories?: CategoryInterface[];
}

export default function FeaturedCategories({
  initialCategories = [],
}: FeaturedCategoriesProps) {
  const categories = initialCategories;
  const loading = !categories || categories.length === 0;

  return (
    // border-y-2 keeps the top and bottom borders at the exact same uniform 2px thickness
    // bg-muted steps the tone into a deeper oatmeal/kraft beige to break monotony
    <section className="w-full border-y-2 border-border bg-muted">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
              <span>✦</span>
              <span>Browse by Mood</span>
            </div>
            <h2 className="mb-5 text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
              Featured Categories
            </h2>
            <p className="max-w-[520px] text-lg leading-relaxed text-muted-foreground">
              Fifteen curated worlds of pop-culture wall art. Start with the
              ones people frame the most.
            </p>
          </div>

          <Link
            href="/categories"
            prefetch={true}
            className="group inline-flex items-center gap-2 border-2 border-border bg-card px-4 py-2.5 text-[13px] font-black uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
          >
            View all categories
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <FeaturedCardSkeleton key={i} />
              ))
            : categories
                .slice(0, 4)
                .map((c) => <FeaturedCard key={c.id} category={c} />)}
        </div>
      </div>
    </section>
  );
}