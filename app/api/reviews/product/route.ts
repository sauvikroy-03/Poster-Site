import { NextRequest, NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // keep YOUR working path here

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

interface ItemRow {
  order_item_id: string;
  order_id: string;
  product_id: string | null;
  orders: { user_id: string; status: string };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderItemId = body.orderItemId ? String(body.orderItemId).trim() : "";
    const rating = Number(body.rating);

    if (!orderItemId) return fail("orderItemId is required.", 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail("Rating must be between 1 and 5.", 400);
    }

    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please log in to rate this product.", 401);

    const admin = getSupabaseAdmin();

    // product_id comes from the DB, never from the client
    const { data, error } = await admin
      .from("order_items")
      .select("order_item_id, order_id, product_id, orders!inner(user_id, status)")
      .eq("order_item_id", orderItemId)
      .maybeSingle();

    if (error) return fail("Failed to load order item.", 400);

    const item = data as unknown as ItemRow | null;
    if (!item || item.orders.user_id !== user.id) return fail("Item not found.", 404);
    if (item.orders.status !== "delivered") {
      return fail("You can rate items once your order has been delivered.", 403);
    }
    if (!item.product_id) return fail("This product is no longer available.", 400);

    // Ratings lock once the order review has been submitted
    const { data: submitted, error: submittedError } = await admin
      .from("store_reviews")
      .select("review_id")
      .eq("order_id", item.order_id)
      .maybeSingle();

    if (submittedError) {
      console.error("❌ Review Lock Check Error:", submittedError.message);
      return fail("Failed to save rating.", 500);
    }
    if (submitted) {
      return fail("Ratings are locked once you've submitted your review.", 403);
    }

    // One rating per user per product: update if it exists, insert otherwise
    const { data: existing } = await admin
      .from("product_reviews")
      .select("review_id")
      .eq("user_id", user.id)
      .eq("product_id", item.product_id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await admin
        .from("product_reviews")
        .update({ rating })
        .eq("review_id", existing.review_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("❌ Product Rating Update Error:", updateError.message);
        return fail("Failed to update rating.", 500);
      }
      return NextResponse.json({ success: true, message: "Rating updated." });
    }

    const { error: insertError } = await admin.from("product_reviews").insert({
      user_id: user.id,
      order_item_id: item.order_item_id,
      product_id: item.product_id,
      rating,
    });

    if (insertError) {
      console.error("❌ Product Rating Insert Error:", insertError.message);
      if (insertError.code === "23505") return fail("You've already rated this product.", 409);
      return fail("Failed to save rating.", 500);
    }

    return NextResponse.json({ success: true, message: "Rating saved." }, { status: 201 });
  } catch (err: unknown) {
    console.error("❌ Product Rating Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}