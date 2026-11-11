import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // keep YOUR working path

export interface ProductRating {
  avgRating: number;
  reviewCount: number;
}

async function fetchProductRating(productId: string): Promise<ProductRating> {
  const admin = getSupabaseAdmin() as unknown as SupabaseClient;

  const { data, error } = await admin
    .rpc("get_product_rating", { p_product_id: productId })
    .single();

  if (error) {
    console.error("❌ Product Rating Fetch Error:", error.message);
    return { avgRating: 0, reviewCount: 0 };
  }

  const row = data as { avg_rating: number | string; review_count: number | string } | null;

  return {
    avgRating: Number(row?.avg_rating ?? 0),
    reviewCount: Number(row?.review_count ?? 0),
  };
}

// Cached for 5 minutes per product (the product id is part of the cache key)
export const getProductRating = unstable_cache(fetchProductRating, ["product-rating"], {
  revalidate: 300,
});