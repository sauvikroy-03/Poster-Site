import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // keep YOUR working path

export interface PublicReview {
  id: string;
  rating: number;
  quote: string;
  name: string;
  location: string;
  date: string;
  images: string[];
}

export interface PublicReviewData {
  reviews: PublicReview[];
  avgRating: number;
  reviewCount: number;
}

interface Row {
  review_id: string;
  rating: number;
  note: string | null;
  images: string[] | null;
  created_at: string;
  orders: {
    shipping_address: {
      first_name?: string;
      last_name?: string;
      city?: string;
    } | null;
  } | null;
}

// "Ananya Rao" -> "Ananya R." (first name + last initial only, for privacy)
function displayName(first?: string, last?: string) {
  const f = first?.trim();
  const l = last?.trim();
  if (!f) return "Verified customer";
  return l ? `${f} ${l.charAt(0)}.` : f;
}

async function fetchPublicReviews(): Promise<PublicReviewData> {
  const admin = getSupabaseAdmin() as unknown as SupabaseClient;

  const [{ data: rows, error }, { data: summary }] = await Promise.all([
    admin
      .from("store_reviews")
      .select("review_id, rating, note, images, created_at, orders(shipping_address)")
      .not("note", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    admin.rpc("get_store_rating").single(),
  ]);

  if (error) {
    console.error("❌ Public Reviews Fetch Error:", error.message);
    return { reviews: [], avgRating: 0, reviewCount: 0 };
  }

  const reviews = ((rows ?? []) as unknown as Row[]).map((r) => {
    const addr = r.orders?.shipping_address;
    return {
      id: r.review_id,
      rating: r.rating,
      quote: r.note ?? "",
      name: displayName(addr?.first_name, addr?.last_name),
      location: addr?.city?.trim() ?? "",
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      images: r.images ?? [],
    };
  });

  const s = summary as { avg_rating: number | string; review_count: number | string } | null;

  return {
    reviews,
    avgRating: Number(s?.avg_rating ?? 0),
    reviewCount: Number(s?.review_count ?? 0),
  };
}

// Cached for 5 minutes so the homepage doesn't hit the DB on every visit
export const getPublicReviews = unstable_cache(fetchPublicReviews, ["public-store-reviews"], {
  revalidate: 300,
});