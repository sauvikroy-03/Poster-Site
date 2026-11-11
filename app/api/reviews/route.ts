import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

interface OrderRow {
  order_id: string;
  order_number: string;
  user_id: string;
  status: string;
  order_items: {
    order_item_id: string;
    product_id: string | null;
    prod_name: string;
    prod_image: string | null;
    prod_size: string | null;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
    if (!orderId) return fail("orderId is required.", 400);

    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please log in to review your order.", 401);

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("orders")
      .select(
        "order_id, order_number, user_id, status, order_items(order_item_id, product_id, prod_name, prod_image, prod_size)"
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      console.error("❌ Review Order Fetch Error:", error.message);
      return fail("Failed to load order.", 400);
    }

    const order = data as unknown as OrderRow | null;

    // Same message for "doesn't exist" and "not yours" so order ids can't be probed
    if (!order || order.user_id !== user.id) return fail("Order not found.", 404);
    if (order.status !== "delivered") {
      return fail("You can review your order once it has been delivered.", 403);
    }

    // One row per product (same poster in two sizes = one rating)
    const seen = new Set<string>();
    const uniqueItems = order.order_items.filter((item) => {
      if (!item.product_id || seen.has(item.product_id)) return false;
      seen.add(item.product_id);
      return true;
    });

    const productIds = uniqueItems.map((i) => i.product_id as string);

    const [{ data: storeReview }, { data: productReviews }] = await Promise.all([
      admin
        .from("store_reviews")
        .select("rating, note, images")
        .eq("order_id", orderId)
        .maybeSingle(),
      productIds.length
        ? admin
            .from("product_reviews")
            .select("product_id, rating")
            .eq("user_id", user.id)
            .in("product_id", productIds)
        : Promise.resolve({ data: [] as { product_id: string; rating: number }[] }),
    ]);

    const ratingByProduct = new Map(
      (productReviews ?? []).map((r) => [r.product_id, r.rating])
    );

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      storeReview: storeReview ?? null,
      items: uniqueItems.map((item) => ({
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        prod_name: item.prod_name,
        prod_image: item.prod_image,
        prod_size: item.prod_size,
        rating: ratingByProduct.get(item.product_id as string) ?? null,
      })),
    });
  } catch (err: unknown) {
    console.error("❌ Reviews GET Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}