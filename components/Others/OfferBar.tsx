import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import OfferBarContent from "@/components/Others/OfferBarContent";

async function getNewUserCoupon() {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("coupons")
    .select("coupon_code, description, usage_limit, total_usage")
    .eq("user_type", "new")
    .eq("is_active", true)
    .lte("start_datetime", nowIso)
    .gte("end_datetime", nowIso)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Offer bar coupon error:", error.message);
    return null;
  }

  // newest active coupon that still has uses left
  return (
    data?.find((c) => c.usage_limit === null || c.total_usage < c.usage_limit) ?? null
  );
}

async function userHasPaidOrder(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {}, // read-only here; middleware refreshes the session
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false; // logged-out visitors still see the offer

  const { count } = await getSupabaseAdmin()
    .from("orders")
    .select("order_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("payment_status", "paid");

  return (count ?? 0) > 0;
}

export default async function OfferBar() {
  const [coupon, isExisting] = await Promise.all([getNewUserCoupon(), userHasPaidOrder()]);

  if (!coupon || isExisting) return null;

  return <OfferBarContent code={coupon.coupon_code} description={coupon.description} />;
}