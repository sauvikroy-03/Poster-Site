import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkCouponForSubtotal, type CouponInfo } from "@/lib/coupons-shared";

type Result =
  | { ok: true; coupon: CouponInfo; discount: number }
  | { ok: false; message: string };

export async function validateCoupon(params: {
  code: string;
  userId: string;
  subtotal: number;
}): Promise<Result> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a promo code." };

  const admin = getSupabaseAdmin();

  const { data: c, error } = await admin
    .from("coupons")
    .select(
      "coupon_id, coupon_code, description, discount_type, discount_amount, max_discount_amount, minimum_order_value, maximum_order_value, user_type, usage_limit, per_user_limit, total_usage, is_active, start_datetime, end_datetime"
    )
    .eq("coupon_code", code)
    .maybeSingle();

  if (error) {
    console.error("❌ Coupon lookup error:", error.message);
    return { ok: false, message: "Could not verify coupon. Try again." };
  }
  if (!c || !c.is_active) return { ok: false, message: "Invalid promo code." };

  const now = Date.now();
  if (now < new Date(c.start_datetime).getTime()) {
    return { ok: false, message: "This coupon is not active yet." };
  }
  if (now > new Date(c.end_datetime).getTime()) {
    return { ok: false, message: "This coupon has expired." };
  }
  if (c.usage_limit !== null && c.total_usage >= c.usage_limit) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }

  // Per-user limit
  const { count, error: usageError } = await admin
    .from("coupon_usages")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", c.coupon_id)
    .eq("user_id", params.userId);

  if (usageError) {
    console.error("❌ Coupon usage lookup error:", usageError.message);
    return { ok: false, message: "Could not verify coupon. Try again." };
  }
  if ((count ?? 0) >= c.per_user_limit) {
    return { ok: false, message: "You have already used this coupon." };
  }

  // ---- User type: new / existing / all ----
  if (c.user_type === "new" || c.user_type === "existing") {
    const { count: paidOrders, error: ordersError } = await admin
      .from("orders")
      .select("order_id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .eq("payment_status", "paid");

    if (ordersError) {
      console.error("❌ Coupon order-history lookup error:", ordersError.message);
      return { ok: false, message: "Could not verify coupon. Try again." };
    }

    const hasPaidOrders = (paidOrders ?? 0) > 0;

    if (c.user_type === "new" && hasPaidOrders) {
      return { ok: false, message: "This coupon is only for new customers." };
    }
    if (c.user_type === "existing" && !hasPaidOrders) {
      return { ok: false, message: "This coupon is only for returning customers." };
    }
  }

  const coupon: CouponInfo = {
    coupon_id: c.coupon_id,
    coupon_code: c.coupon_code,
    description: c.description,
    discount_type: c.discount_type,
    discount_amount: c.discount_amount,
    max_discount_amount: c.max_discount_amount,
    minimum_order_value: c.minimum_order_value,
    maximum_order_value: c.maximum_order_value,
  };

  const check = checkCouponForSubtotal(coupon, params.subtotal);
  if (!check.valid) return { ok: false, message: check.reason! };

  return { ok: true, coupon, discount: check.discount };
}