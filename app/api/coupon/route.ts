import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateCoupon } from "@/lib/coupons";

const MAX_QUANTITY = 99;

async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore
        }
      },
    },
  });
}

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const promoCode = typeof body?.promoCode === "string" ? body.promoCode : "";

    const supabase = await getSupabaseServerClient();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please log in to apply a coupon.", 401);

    // Subtotal from the DB, never from the client
    const { data: rows, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, product_variants ( prod_price )")
      .eq("user_id", user.id);

    if (cartError) return fail("Could not read your cart.", 400);
    if (!rows || rows.length === 0) return fail("Your cart is empty.", 400);

    const subtotal = (rows as unknown as {
      quantity: number;
      product_variants: { prod_price: number | string } | null;
    }[]).reduce(
      (sum, r) =>
        sum + Number(r.product_variants?.prod_price ?? 0) * Math.min(r.quantity, MAX_QUANTITY),
      0
    );

    const result = await validateCoupon({ code: promoCode, userId: user.id, subtotal });
    if (!result.ok) return fail(result.message, 400);

    return NextResponse.json({ success: true, coupon: result.coupon, discount: result.discount });
  } catch (err: unknown) {
    console.error("❌ Coupon route error:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}