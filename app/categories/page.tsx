import React, { Suspense } from "react";
import { Search } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import CategoriesFilter from "@/components/CategoryPage/CategoriesFilter";
import PriceFilter from "@/components/CategoryPage/PriceFilter";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";
import ProjectDataInterface from "@/types/ItemDetails";
import CategoryHero from "@/components/CategoryPage/CategoryHero";
import Navbar from "@/components/Navbar";

async function getFilteredProducts({
  category,
  maxPrice,
  sort,
}: {
  category?: string;
  maxPrice?: string;
  sort?: string;
}): Promise<ProjectDataInterface[]> {
  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
  );

  // !inner forces Postgres to only return products that actually have
  // a matching variant row when we filter on price — without it, a
  // price filter on the embedded resource just trims which variants
  // show up per product, not which products come back at all.
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
    // Matches "tv-shows" -> "tv shows" against a display-name category
    // column. If you add a real category_slug column later, swap this
    // for .eq("category_slug", category) — it's more reliable.
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

  // Sorting by "cheapest variant" can't be expressed as a PostgREST
  // .order() on an embedded resource, so sort the already-filtered
  // (small) result in memory here.
  if (sort === "price-asc" || sort === "price-desc") {
    const minPrice = (p: ProjectDataInterface) =>
      Math.min(...p.product_variants.map((v) => Number(v.prod_price)));

    products = [...products].sort((a, b) =>
      sort === "price-asc" ? minPrice(a) - minPrice(b) : minPrice(b) - minPrice(a)
    );
  }

  return products;
}

// Isolated async component that does the fetching + rendering,
// so Suspense can show a fallback while THIS specific part awaits.
async function ProductResults({
  category,
  maxPrice,
  sort,
}: {
  category?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const products = await getFilteredProducts({ category, maxPrice, sort });

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold text-neutral-800">
          {products.length} posters
        </span>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Sort by</span>
          <select className="cursor-pointer rounded-md border border-neutral-200 bg-transparent px-2.5 py-1.5 font-semibold text-neutral-800 outline-none hover:border-black">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-neutral-200 p-8 text-center">
          <p className="text-sm font-bold uppercase text-neutral-400">
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
      <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; maxPrice?: string }>;
}) {
  const { category, maxPrice, sort } = await searchParams;

  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
    
      <CategoryHero />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-4">
          <aside className="col-span-1 flex flex-col gap-6">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search posters"
                className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-neutral-800 outline-none transition-colors focus:border-black"
              />
            </div>

            <Suspense
              fallback={
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-24 animate-pulse rounded-full bg-neutral-200" />
                    <div className="h-8 w-28 animate-pulse rounded-full bg-neutral-200" />
                  </div>
                </div>
              }
            >
              <CategoriesFilter />
              <PriceFilter />
            </Suspense>
          </aside>

          <main className="col-span-1 md:col-span-3">
            <Suspense fallback={<ProductResultsSkeleton />}>
              <ProductResults category={category} maxPrice={maxPrice} sort={sort} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}