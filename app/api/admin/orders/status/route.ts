// app/api/admin/orders/status/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Must match values in your order_status enum.
const ALLOWED_STATUSES = ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const FINAL_STATUSES = ["delivered", "cancelled"];
const REQUIRES_PAYMENT = ["shipped", "out_for_delivery", "delivered"];

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

// Same helper you use in create-order / verify-payment
async function getAuthedClient() {
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

export async function PATCH(req: Request) {
  try {
    // 1. Only admins. Put a comma-separated list of emails in ADMIN_EMAILS.
    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admins = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!user?.email || !admins.includes(user.email.toLowerCase())) {
      return fail("Forbidden.", 403);
    }

    // 2. Validate input
    const { order_id, status } = await req.json();
    if (!order_id || !ALLOWED_STATUSES.includes(status)) {
      return fail("Invalid order or status.", 400);
    }

    const admin = getSupabaseAdmin();

    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("status, payment_status")
      .eq("order_id", order_id)
      .single();

    if (fetchError || !order) return fail("Order not found.", 404);

    if (FINAL_STATUSES.includes(order.status)) {
      return fail(`Order is already ${order.status}.`, 409);
    }

    // Never ship an order that hasn't been paid for
    if (REQUIRES_PAYMENT.includes(status) && order.payment_status !== "paid") {
      return fail("Order is not paid yet.", 409);
    }

    // 3. Update. Your trigger writes the order_status_history row automatically.
    const { error } = await admin.from("orders").update({ status }).eq("order_id", order_id);
    if (error) {
      console.error("❌ Order Status Update Error:", error.message);
      return fail("Failed to update status.", 500);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Admin Order Status Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}