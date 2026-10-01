// app/api/myorders/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to view orders." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        order_id,
        order_number,
        status,
        payment_status,
        subtotal,
        delivery_charge,
        discount_amount,
        total_amount,
        shipping_address,
        coupon_code,
        discount_details,
        placed_at,
        order_items (
          order_item_id,
          product_id,
          variant_id,
          prod_name,
          prod_image,
          prod_size,
          prod_material,
          sku,
          unit_price,
          quantity,
          line_total
        ),
        order_status_history (
          status,
          changed_at
        )
      `)
      .eq("user_id", user.id)
      .eq("payment_status", "paid")
      .order("placed_at", { ascending: false });

    if (error) {
      console.error("❌ Orders Fetch Error:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, orders: data ?? [] }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Get Orders Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}