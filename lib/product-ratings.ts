import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // keep YOUR working path

export type RatingsMap = Record<string, { avgRating: number; reviewCount: number }>;

async function fetchProductRatings(productIds: string[]): Promise<RatingsMap> {
  if (productIds.length === 0) return {};

  const admin = getSupabaseAdmin() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("get_product_ratings", {
    p_product_ids: productIds,
  });

  if (error) {
    console.error("❌ Product Ratings Fetch Error:", error.message);
    return {};
  }

  const map: RatingsMap = {};
  for (const row of (data ?? []) as {
    product_id: string;
    avg_rating: number | string;
    review_count: number | string;
  }[]) {
    map[row.product_id] = {
      avgRating: Number(row.avg_rating),
      reviewCount: Number(row.review_count),
    };
  }
  return map;
}

const cachedRatings = unstable_cache(fetchProductRatings, ["product-ratings"], {
  revalidate: 300,
});

// Sorted so the same set of products always hits the same cache entry
export function getProductRatings(productIds: string[]) {
  return cachedRatings([...new Set(productIds)].sort());
}