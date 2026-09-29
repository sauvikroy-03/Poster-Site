import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

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

interface VerifyBody {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail("Missing payment verification details.", 400);
    }

    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return fail("Please log in to complete payment.", 401);

    const admin = getSupabaseAdmin();

    // Confirm this payment row actually belongs to this user and matches the
    // razorpay order *we* generated in create-order — never trust the client's claim alone.
    const { data: payment, error: paymentFetchError } = await admin
      .from("payments")
      .select("payment_id, order_id, user_id, status")
      .eq("order_id", orderId)
      .eq("gateway_order_id", razorpay_order_id)
      .maybeSingle();

    if (paymentFetchError) {
      console.error("❌ Payment Fetch Error:", paymentFetchError.message);
      return fail(paymentFetchError.message, 400);
    }
    if (!payment || payment.user_id !== user.id) {
      return fail("Payment record not found.", 404);
    }

    // Idempotency: don't reprocess a payment that already succeeded
    // (handles double-fires of the Razorpay success handler).
    if (payment.status === "captured") {
      return NextResponse.json({ success: true, message: "Payment already verified.", orderId }, { status: 200 });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      await admin
        .from("payments")
        .update({ status: "failed", failure_reason: "Signature verification failed." })
        .eq("payment_id", payment.payment_id);

      await admin.from("orders").update({ payment_status: "failed" }).eq("order_id", orderId);

      return fail("Payment verification failed.", 400);
    }

    const { error: paymentUpdateError } = await admin
      .from("payments")
      .update({
        gateway_payment_id: razorpay_payment_id,
        gateway_signature: razorpay_signature,
        status: "captured",
      })
      .eq("payment_id", payment.payment_id);

    if (paymentUpdateError) {
      console.error("❌ Payment Update Error:", paymentUpdateError.message);
      return fail("Failed to record payment.", 500);
    }

    const { error: orderUpdateError } = await admin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("order_id", orderId);

    if (orderUpdateError) {
      console.error("❌ Order Update Error:", orderUpdateError.message);
      return fail("Failed to confirm order.", 500);
    }

    // Clear the cart now that payment is confirmed — same scoping pattern as /api/cart.
    const { error: cartClearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
    if (cartClearError) {
      console.error("❌ Cart Clear Error:", cartClearError.message); // non-fatal, order is already confirmed
    }

    return NextResponse.json({ success: true, message: "Payment verified.", orderId }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Verify Payment Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}