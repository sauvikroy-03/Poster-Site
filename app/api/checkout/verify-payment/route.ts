import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { fulfillCapturedOrder } from "@/lib/fulfill-order";

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

async function getAuthedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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

    if (payment.status === "captured") {
      return NextResponse.json(
        { success: true, message: "Payment already verified.", orderId },
        { status: 200 }
      );
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
        .eq("payment_id", payment.payment_id)
        .neq("status", "captured");

      await admin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("order_id", orderId)
        .neq("payment_status", "paid");

      return fail("Payment verification failed.", 400);
    }

    await fulfillCapturedOrder({
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return NextResponse.json(
      { success: true, message: "Payment verified.", orderId },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Verify Payment Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}