import React from 'react'
import { createClient } from "@supabase/supabase-js";
import ProductImage from '@/components/ProductPage/ProductImage';
import ProductCardSkeleton from '@/components/skeletons/SK_ProductCard';
interface PageProps {
  params: Promise<{ id: string }>;
}


export default async function page({ params }: PageProps) {
    const { id } = await params;

  // `id` is now "122" (as a string) if the URL was /product/122
  console.log(id);
  return (
    <div>
      
    </div>
  )
}
