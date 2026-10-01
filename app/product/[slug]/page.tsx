import React, { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import ProductImage from "@/components/ProductPage/ProductImage";
import ProductCardSkeleton from "@/components/skeletons/SK_ProductCard";
import ProjectDataInterface from "@/types/ItemDetails";
import AddToCartForm from "@/components/ProductPage/AddToCartForm";

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

// Data fetching component streamed by Suspense
async function ProductContent({ slug }: { slug: string }) {
  const productData = await getProductBySlug(slug);

  return (
    <>
      <div className="w-full md:w-1/2 lg:w-2/5">
        {productData ? <ProductImage product={productData} /> : <ProductCardSkeleton />}
      </div>
      <div className="w-full md:w-1/2 lg:w-3/5">
        {productData ? <AddToCartForm product={productData} /> : <h1></h1>}
      </div>
    </>
  );
}

// Immediate skeleton shown while Supabase resolves
function ProductContentSkeleton() {
  return (
    <>
      <div className="w-full md:w-1/2 lg:w-2/5">
        <ProductCardSkeleton />
      </div>
      <div className="w-full md:w-1/2 lg:w-3/5 animate-pulse space-y-4">
        <div className="h-9 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-28 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-12 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
      </div>
    </>
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="sm:pl-10 sm:pr-10 md:pl-25 md:pr-25 lg:pl-30 lg:pr-30 bg-background">
      <div className="flex flex-col gap-8 p-4 md:flex-row md:gap-12 md:p-8 lg:flex-row">
        <Suspense fallback={<ProductContentSkeleton />}>
          <ProductContent slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}