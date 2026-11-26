import { ArrowRight } from "lucide-react";
import ProjectDataInterface from "@/types/ItemDetails";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./skeletons/SK_ProductCard";
import Link from "next/link";
import { getProductRatings } from "@/lib/product-ratings";

interface HeroProps {
  initialProducts?: ProjectDataInterface[];
}

function arrangeHeroSlots(
  heroProducts: ProjectDataInterface[]
): Array<ProjectDataInterface | undefined> {
  const HERO_SLOT_COUNT = 3;
  const slots: Array<ProjectDataInterface | undefined> =
    Array(HERO_SLOT_COUNT).fill(undefined);

  const numbered: ProjectDataInterface[] = [];
  const unnumbered: ProjectDataInterface[] = [];

  for (const product of heroProducts) {
    if (typeof product.hero_order === "number" && product.hero_order >= 1) {
      numbered.push(product);
    } else {
      unnumbered.push(product);
    }
  }

  numbered.sort((a, b) => (a.hero_order ?? 0) - (b.hero_order ?? 0));

  const overflow: ProjectDataInterface[] = [];

  for (const product of numbered) {
    const slotIndex = (product.hero_order as number) - 1;
    if (slotIndex < HERO_SLOT_COUNT && !slots[slotIndex]) {
      slots[slotIndex] = product;
    } else {
      overflow.push(product);
    }
  }

  const remaining = [...overflow, ...unnumbered];
  for (let i = 0; i < HERO_SLOT_COUNT && remaining.length > 0; i++) {
    if (!slots[i]) {
      slots[i] = remaining.shift();
    }
  }

  return slots;
}

export default async function Hero({ initialProducts = [] }: HeroProps) {
  const products = arrangeHeroSlots(
    initialProducts.filter((p) => p.hero_visible === true)
  );
  const ratings = await getProductRatings(
    products.filter((p): p is ProjectDataInterface => Boolean(p)).map((p) => p.prod_id)
  );

  return (
    <section className="w-full border-b-2 border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
          {/* Left column: Headline, copy, and Shop + Customize CTAs */}
          <div className="flex flex-col items-start lg:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              {/* Burnt terracotta accent bar */}
              <span className="h-5 w-1 bg-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Edition No. 04 — Indian Pop-Culture Collective
              </span>
            </div>

            <h1 className="text-6xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl xl:text-8xl">
              Transform
              <br />
              Your
              <br />
              Walls
            </h1>

            <p className="mt-6 max-w-md text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              A curated selection of pop-culture artifacts for the modern Indian dwelling.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/categories"
                className="group inline-flex items-center gap-2 border-2 border-border bg-accent px-6 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-[4px_4px_0px_0px_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--border)]"
              >
                Shop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/customize"
                className="group inline-flex items-center gap-2 border-2 border-border bg-card px-6 py-3 text-sm font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0px_0px_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_var(--border)]"
              >
                Customize
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right column: 3-poster asymmetrical grid (2 cols on mobile, 3 cols on desktop) */}
          <div className="grid grid-cols-2 items-start gap-4 lg:col-span-6 lg:grid-cols-3">
            {/* Card 0: Full width on mobile, 2x2 large spotlight card on desktop */}
            <div className="col-span-2 lg:col-span-2 lg:row-span-2">
              {products[0] ? (
                <ProductCard
                  product={products[0]}
                  priority={true}
                  avgRating={ratings[products[0].prod_id]?.avgRating}
                  reviewCount={ratings[products[0].prod_id]?.reviewCount}
                />
              ) : (
                <ProductCardSkeleton />
              )}
            </div>

            {/* Card 1: Top right on desktop, left half on mobile */}
            <div className="col-span-1">
              {products[1] ? (
                <ProductCard
                  product={products[1]}
                  avgRating={ratings[products[1].prod_id]?.avgRating}
                  reviewCount={ratings[products[1].prod_id]?.reviewCount}
                />
              ) : (
                <ProductCardSkeleton />
              )}
            </div>

            {/* Card 2: Bottom right on desktop, right half on mobile */}
            <div className="col-span-1">
              {products[2] ? (
                <ProductCard
                  product={products[2]}
                  avgRating={ratings[products[2].prod_id]?.avgRating}
                  reviewCount={ratings[products[2].prod_id]?.reviewCount}
                />
              ) : (
                <ProductCardSkeleton />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
