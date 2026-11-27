import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import ProductImage from "@/components/ProductPage/ProductImage";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";
import ProjectDataInterface from "@/types/ItemDetails";
import AddToCartForm from "@/components/ProductPage/AddToCartForm";
import { getProductRatings } from "@/lib/product-ratings";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Keep pages cached at the edge for 60 seconds
export const revalidate = 60;

// Pre-render existing product slugs at build time for 0ms transitions
export async function generateStaticParams() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: products } = await supabase
      .from("products")
      .select("prod_slug");

    return (products || []).map((product) => ({
      slug: product.prod_slug,
    }));
  } catch {
    return [];
  }
}

async function getProductBySlug(slug: string): Promise<ProjectDataInterface | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("products")
    .select(`
      prod_id,
      created_at,
      prod_name,
      prod_slug,
      prod_category,
      prod_description,
      prod_images,
      is_trending,
      hero_visible,
      product_variants (
        variant_id,
        prod_size,
        prod_material,
        prod_price,
        compare_at_price,
        sku,
        is_in_stock
      )
    `)
    .eq("prod_slug", slug)
    .single();

  if (error || !data) {
    console.error("Error fetching product:", error?.message);
    return null;
  }

  return data as unknown as ProjectDataInterface;
}

async function getRelatedProducts(
  category: string,
  excludeProdId: string
): Promise<ProjectDataInterface[]> {
  const trimmedCategory = category.trim();
  if (!trimmedCategory) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      prod_id,
      created_at,
      prod_name,
      prod_slug,
      prod_category,
      prod_description,
      prod_images,
      prod_preview_image,
      is_trending,
      hero_visible,
      product_variants (
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
    .eq("prod_is_active", true)
    .ilike("prod_category", trimmedCategory)
    .neq("prod_id", excludeProdId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching related products:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProjectDataInterface[];
}

// Data fetching component streamed by Suspense
async function ProductContent({ slug }: { slug: string }) {
  const productData = await getProductBySlug(slug);

  // Batch helper takes an array and returns a map keyed by prod_id.
  // It never throws, so the page still renders if it fails.
  let avgRating = 0;
  let reviewCount = 0;
  let relatedProducts: ProjectDataInterface[] = [];
  let relatedRatings: Record<string, { avgRating: number; reviewCount: number }> =
    {};

  if (productData) {
    const [mainRatings, sameCategory] = await Promise.all([
      getProductRatings([productData.prod_id]),
      getRelatedProducts(productData.prod_category, productData.prod_id),
    ]);

    avgRating = mainRatings[productData.prod_id]?.avgRating ?? 0;
    reviewCount = mainRatings[productData.prod_id]?.reviewCount ?? 0;
    relatedProducts = sameCategory;

    if (relatedProducts.length > 0) {
      relatedRatings = await getProductRatings(
        relatedProducts.map((p) => p.prod_id)
      );
    }
  }

  const categorySlug = productData?.prod_category
    ? productData.prod_category.trim().toLowerCase().replace(/\s+/g, "-")
    : "";

  return (
    <>
      <div className="flex flex-col gap-8 p-4 md:flex-row md:gap-12 md:p-8 lg:flex-row">
        <div className="w-full md:w-1/2 lg:w-2/5">
          {productData ? (
            <ProductImage product={productData} />
          ) : (
            <ProductCardSkeleton />
          )}
        </div>
        <div className="w-full md:w-1/2 lg:w-3/5">
          {productData ? (
            <AddToCartForm
              product={productData}
              avgRating={avgRating}
              reviewCount={reviewCount}
            />
          ) : (
            <h1></h1>
          )}
        </div>
      </div>

      {productData && relatedProducts.length > 0 && (
        <section
          aria-labelledby="related-posters-heading"
          className="mt-4 border-t-2 border-border px-4 pb-12 pt-8 md:px-8 md:pt-10"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center border-2 border-border bg-card px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
                More in {productData.prod_category}
              </div>
              <h2
                id="related-posters-heading"
                className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl"
              >
                You May Also Like
              </h2>
            </div>

            {categorySlug && (
              <Link
                href={`/categories?category=${encodeURIComponent(categorySlug)}`}
                className="group inline-flex items-center gap-1.5 border-2 border-border bg-card px-3.5 py-2 text-xs font-black uppercase tracking-wider text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 sm:gap-5">
            {relatedProducts.map((item) => (
              <div
                key={item.prod_id}
                className="w-[175px] shrink-0 snap-start sm:w-[215px] md:w-[235px] lg:w-[255px]"
              >
                <ProductCard
                  product={item}
                  avgRating={relatedRatings[item.prod_id]?.avgRating}
                  reviewCount={relatedRatings[item.prod_id]?.reviewCount}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// Immediate skeleton shown while Supabase resolves
function ProductContentSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-4 md:flex-row md:gap-12 md:p-8 lg:flex-row">
      <div className="w-full md:w-1/2 lg:w-2/5">
        <ProductCardSkeleton />
      </div>
      <div className="w-full md:w-1/2 lg:w-3/5 animate-pulse space-y-4">
        <div className="h-9 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-28 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-12 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="sm:pl-10 sm:pr-10 md:pl-25 md:pr-25 lg:pl-30 lg:pr-30 bg-background">
      <Suspense fallback={<ProductContentSkeleton />}>
        <ProductContent slug={slug} />
      </Suspense>
    </div>
  );
}