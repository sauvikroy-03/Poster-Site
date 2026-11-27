import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkCouponForSubtotal, type CouponInfo } from "@/lib/coupons-shared";

type Result =
  | { ok: true; coupon: CouponInfo; discount: number }
  | { ok: false; message: string };

type CouponRow = CouponInfo & {
  user_type: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  total_usage: number;
  is_active: boolean;
  start_datetime: string;
  end_datetime: string;
};

const COUPON_SELECT =
  "coupon_id, coupon_code, description, discount_type, discount_amount, max_discount_amount, minimum_order_value, maximum_order_value, user_type, usage_limit, per_user_limit, total_usage, is_active, start_datetime, end_datetime";

function toCouponInfo(c: CouponRow): CouponInfo {
  return {
    coupon_id: c.coupon_id,
    coupon_code: c.coupon_code,
    description: c.description,
    discount_type: c.discount_type,
    discount_amount: c.discount_amount,
    max_discount_amount: c.max_discount_amount,
    minimum_order_value: c.minimum_order_value,
    maximum_order_value: c.maximum_order_value,
  };
}

async function userHasPaidOrders(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<{ hasPaidOrders: boolean; error: string | null }> {
  const { count, error } = await admin
    .from("orders")
    .select("order_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("payment_status", "paid");

  if (error) {
    return { hasPaidOrders: false, error: error.message };
  }
  return { hasPaidOrders: (count ?? 0) > 0, error: null };
}

export async function getAvailableCoupons(userId: string): Promise<CouponInfo[]> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("is_active", true)
    .lte("start_datetime", nowIso)
    .gte("end_datetime", nowIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Available coupons lookup error:", error.message);
    return [];
  }

  const activeRows = ((data as CouponRow[] | null) ?? []).filter(
    (c) => c.usage_limit === null || c.total_usage < c.usage_limit
  );
  if (activeRows.length === 0) return [];

  const couponIds = activeRows.map((c) => c.coupon_id);
  const needsOrderHistory = activeRows.some(
    (c) => c.user_type === "new" || c.user_type === "existing"
  );

  const [usageRes, orderHistoryRes] = await Promise.all([
    admin
      .from("coupon_usages")
      .select("coupon_id")
      .eq("user_id", userId)
      .in("coupon_id", couponIds),
    needsOrderHistory
      ? userHasPaidOrders(admin, userId)
      : Promise.resolve({ hasPaidOrders: false, error: null }),
  ]);

  if (usageRes.error) {
    console.error("❌ Available coupons usage lookup error:", usageRes.error.message);
    return [];
  }
  if (orderHistoryRes.error) {
    console.error("❌ Available coupons order-history error:", orderHistoryRes.error);
    return [];
  }

  const usagesByCoupon = new Map<string, number>();
  for (const row of usageRes.data ?? []) {
    usagesByCoupon.set(row.coupon_id, (usagesByCoupon.get(row.coupon_id) ?? 0) + 1);
  }

  return activeRows
    .filter((c) => {
      if ((usagesByCoupon.get(c.coupon_id) ?? 0) >= c.per_user_limit) return false;
      if (c.user_type === "new" && orderHistoryRes.hasPaidOrders) return false;
      if (c.user_type === "existing" && !orderHistoryRes.hasPaidOrders) return false;
      return true;
    })
    .map(toCouponInfo);
}

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
    .select(COUPON_SELECT)
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
    const orderHistory = await userHasPaidOrders(admin, params.userId);

    if (orderHistory.error) {
      console.error("❌ Coupon order-history lookup error:", orderHistory.error);
      return { ok: false, message: "Could not verify coupon. Try again." };
    }

    if (c.user_type === "new" && orderHistory.hasPaidOrders) {
      return { ok: false, message: "This coupon is only for new customers." };
    }
    if (c.user_type === "existing" && !orderHistory.hasPaidOrders) {
      return { ok: false, message: "This coupon is only for returning customers." };
    }
  }

  const coupon = toCouponInfo(c as CouponRow);

  const check = checkCouponForSubtotal(coupon, params.subtotal);
  if (!check.valid) return { ok: false, message: check.reason! };

  return { ok: true, coupon, discount: check.discount };
}