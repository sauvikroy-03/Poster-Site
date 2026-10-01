import { ArrowRight, Flame } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./skeletons/SK_ProductCard";
import Link from "next/link";

interface TrendingPostersProps {
  products?: ProjectDataInterface[];
}

export default function TrendingPosters({ products = [] }: TrendingPostersProps) {
  const loading = !products || products.length === 0;

  return (
    // Steps back to bg-background after the deeper bg-muted in FeaturedCategories
    // border-b-2 border-border ensures uniform 2px border thickness throughout the page
    <section className="w-full border-b-2 border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
              <Flame className="h-3.5 w-3.5 fill-accent text-accent" />
              <span>This Week</span>
            </div>
            <h2 className="mb-5 text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
              Trending Posters
            </h2>
            <p className="max-w-[520px] text-lg leading-relaxed text-muted-foreground">
              The prints moving fastest out of our studio right now.
            </p>
          </div>

          <Link
            href="/categories"
            prefetch={true}
            className="group inline-flex items-center gap-2 border-2 border-border bg-primary px-4 py-2.5 text-[13px] font-black uppercase tracking-[0.1em] text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
          >
            Shop All
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products
                .slice(0, 4)
                .map((p) => <ProductCard key={p.prod_id} product={p} />)}
        </div>
      </div>
    </section>
  );
}