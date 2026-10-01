import React, { Suspense } from "react";
import { Search } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import CategoriesFilter from "@/components/CategoryPage/CategoriesFilter";
import PriceFilter from "@/components/CategoryPage/PriceFilter";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";
import ProjectDataInterface from "@/types/ItemDetails";
import CategoryHero from "@/components/CategoryPage/CategoryHero";

export const revalidate = 60;

// Helper to prevent top-level initialization errors during static build evaluation
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or Secret Key environment variables.");
  }

  return createClient(url, key);
}

async function getFilteredProducts({
  category,
  maxPrice,
  sort,
}: {
  category?: string;
  maxPrice?: string;
  sort?: string;
}): Promise<ProjectDataInterface[]> {
  const supabase = getSupabaseClient();
  const variantsRelation = maxPrice ? "product_variants!inner" : "product_variants";

  let query = supabase
    .from("products")
    .select(
      `
      prod_id,
      prod_name,
      prod_slug,
      prod_category,
      prod_images,
      ${variantsRelation} (
        variant_id,
        prod_size,
        prod_material,
        prod_price,
        compare_at_price,
        sku,
        is_in_stock
      )
    `
    )
    .eq("prod_is_active", true);

  if (category) {
    query = query.ilike("prod_category", category.replace(/-/g, " "));
  }

  if (maxPrice) {
    query = query.lte("product_variants.prod_price", Number(maxPrice));
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Product Fetch Error:", error);
    return [];
  }

  let products = (data ?? []) as unknown as ProjectDataInterface[];

  if (sort === "price-asc" || sort === "price-desc") {
    const minPrice = (p: ProjectDataInterface) =>
      Math.min(...p.product_variants.map((v) => Number(v.prod_price)));

    products = [...products].sort((a, b) =>
      sort === "price-asc" ? minPrice(a) - minPrice(b) : minPrice(b) - minPrice(a)
    );
  }

  return products;
}

async function ProductResults({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ category?: string; sort?: string; maxPrice?: string }>;
}) {
  const { category, maxPrice, sort } = await searchParamsPromise;
  const products = await getFilteredProducts({ category, maxPrice, sort });

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-4">
        <span className="text-xs font-black uppercase tracking-wider text-foreground">
          {products.length} posters
        </span>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">Sort by</span>
          <select className="cursor-pointer border-2 border-border bg-card px-2.5 py-1.5 font-bold uppercase tracking-wider text-foreground outline-none shadow-[2px_2px_0_0_var(--border)] transition-transform hover:-translate-y-0.5">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border bg-card/60 p-8 text-center shadow-[3px_3px_0_0_var(--border)]">
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            No posters found in this category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.prod_id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductResultsSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-4">
        <div className="h-4 w-20 animate-pulse bg-muted" />
        <div className="h-4 w-32 animate-pulse bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; maxPrice?: string }>;
}) {
  const resolvedParams = await searchParams;
  const suspenseKey = `${resolvedParams.category || ""}-${resolvedParams.maxPrice || ""}-${resolvedParams.sort || ""}`;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <CategoryHero />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-4">
          <aside className="col-span-1 flex flex-col gap-6">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search posters..."
                className="w-full border-2 border-border bg-card py-2 pl-10 pr-4 text-xs font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground outline-none shadow-[2px_2px_0_0_var(--border)] transition-all focus:bg-background"
              />
            </div>

            <Suspense
              fallback={
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 animate-pulse bg-muted" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-24 animate-pulse border-2 border-border/40 bg-muted/60" />
                    <div className="h-8 w-28 animate-pulse border-2 border-border/40 bg-muted/60" />
                  </div>
                </div>
              }
            >
              <CategoriesFilter />
              <PriceFilter />
            </Suspense>
          </aside>

          <main className="col-span-1 md:col-span-3">
            {/* key={suspenseKey} guarantees instant skeleton fallback on filter changes */}
            <Suspense key={suspenseKey} fallback={<ProductResultsSkeleton />}>
              <ProductResults searchParamsPromise={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}