import React from 'react'
import { createClient } from "@supabase/supabase-js";
import ProductImage from '@/components/ProductPage/ProductImage';
import ProductCardSkeleton from '@/components/skeletons/SK_ProductCard';
import ProjectDataInterface from '@/types/ItemDetails';
import AddToCartForm from '@/components/ProductPage/AddToCartForm';
interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProductBySlug(slug: string):Promise<ProjectDataInterface | null> {
    
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Or NEXT_PUBLIC_SUPABASE_ANON_KEY
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

export default async function page({ params }: PageProps) {
    const { slug } = await params;
    const productData = await getProductBySlug(slug);
  // `id` is now "122" (as a string) if the URL was /product/122
  return (
    <div className='sm:pl-10 sm:pr-10   md:pl-25 md:pr-25 lg:pl-30 lg:pr-30  '>
    <div className='flex flex-col gap-8  p-4 md:flex-row md:gap-12 md:p-8 lg:flex-row'>
      <div className='w-full md:w-1/2 lg:w-2/5'>
{productData ? <ProductImage product={productData} /> : <ProductCardSkeleton />}
</div>
<div className='w-full md:w-1/2 lg:w-3/5'>
{productData?<AddToCartForm product={productData}/>:<h1></h1>}
</div>
    </div>
    </div>
  )
}
