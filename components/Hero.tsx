import { ArrowRight } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./skeletons/SK_ProductCard";
import Link from "next/link";

interface HeroProps {
  initialProducts?: ProjectDataInterface[];
}

export default function Hero({ initialProducts = [] }: HeroProps) {
  const products = initialProducts;

  return (
    <section className="w-full bg-background border-b-2 border-border">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-6 flex items-center gap-3">
              {/* Burnt terracotta accent bar */}
              <span className="h-5 w-1 bg-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Edition No. 04 — Indian Pop-Culture Collective
              </span>
            </div>
            <h1 className="text-6xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Transform
              <br />
              Your
              <br />
              Walls
            </h1>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
            <p className="max-w-xs text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              A curated selection of pop-culture artifacts for the modern Indian dwelling.
            </p>
            <Link
              href="/categories"
              className="group inline-flex items-center gap-2 border-2 border-border bg-accent px-6 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-[4px_4px_0px_0px_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--border)]"
            >
              Shop the Drop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        

        {/* 2 columns on mobile, 4 columns on desktop */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Card 0: Full width on mobile, 2x2 grid cell on desktop */}
          <div className="col-span-2 md:col-span-2 md:row-span-2 md:h-full">
            {products[0] ? (
              <ProductCard product={products[0]} priority={true} />
            ) : (
              <ProductCardSkeleton />
            )}
          </div>

          {/* Card 1: 1 col on mobile, 1 col on desktop */}
          <div className="col-span-1 md:h-full">
            {products[1] ? (
              <ProductCard product={products[1]} />
            ) : (
              <ProductCardSkeleton />
            )}
          </div>

          {/* Card 2: 1 col on mobile, 1 col on desktop */}
          <div className="col-span-1 md:h-full">
            {products[2] ? (
              <ProductCard product={products[2]} />
            ) : (
              <ProductCardSkeleton />
            )}
          </div>

          {/* Archive Series banner */}
          <Link
            href="/categories"
            className="col-span-2 flex min-h-[160px] gap-6 overflow-hidden border-2 border-border bg-primary p-6 text-primary-foreground shadow-[4px_4px_0px_0px_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 md:col-span-2 md:h-full md:min-h-0"
          >
            <img
              src="https://picsum.photos/seed/archive-series/300/300"
              alt="The Archive Series"
              className="hidden h-full w-40 flex-shrink-0 object-cover border border-border/40 sm:block"
            />
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-primary-foreground">
                  The Archive Series
                </h3>
                <p className="mt-2 max-w-sm text-sm text-primary-foreground/75">
                  Premium 300 GSM gallery-grade matte paper. Acid-free for archival longevity.
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="border-2 border-primary-foreground px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-foreground">
                  Buy Now
                </span>
                <span className="text-lg font-black text-primary-foreground">₹1,499</span>
              </div>
            </div>
          </Link>

          {/* Bottom Card 3 */}
          <div className="col-span-1 flex items-center justify-center md:h-full md:min-h-0">
            {products[3] ? (
              <ProductCard product={products[3]} />
            ) : (
              <ProductCardSkeleton />
            )}
          </div>

          {/* Market Status block (Swapped yellow to kraft sand --secondary) */}
          <div className="col-span-1 flex min-h-[120px] flex-col justify-between border-2 border-border bg-secondary p-5 shadow-[4px_4px_0px_0px_var(--border)] md:h-full md:min-h-0">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground">
              Market Status
            </span>
            <span className="text-3xl font-black uppercase italic tracking-tight text-secondary-foreground">
              New Drop
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}