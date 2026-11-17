import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { Resend } from "resend";
import { sendAiSensyCampaign } from "@/lib/aisensy";

const resend = new Resend(process.env.RESEND_API_KEY || process.env.Resend_API_KEY);

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
    if (payment.status === "captured") {
      console.log("ℹ️ Payment already captured, returning early (no email/WhatsApp)");
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

    // -------------------------------------------------------------
    // Record coupon usage (only now that payment is verified)
    // -------------------------------------------------------------
    try {
      const { data: orderRow } = await admin
        .from("orders")
        .select("coupon_code, discount_amount, discount_details")
        .eq("order_id", orderId)
        .maybeSingle();

      const couponId = (orderRow?.discount_details as { coupon_id?: string } | null)?.coupon_id;

      if (orderRow?.coupon_code && couponId) {
        const { data: existingUsage } = await admin
          .from("coupon_usages")
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!existingUsage) {
          const { error: usageError } = await admin.from("coupon_usages").insert({
            coupon_id: couponId,
            user_id: user.id,
            order_id: orderId,
            discount_applied: Math.round(Number(orderRow.discount_amount)),
          });
          if (usageError) console.error("❌ Coupon Usage Insert Error:", usageError.message);
        }
      }
    } catch (couponErr) {
      console.error("❌ Coupon Usage Error:", couponErr);
    }

    // Clear the cart now that payment is confirmed
    const { error: cartClearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
    if (cartClearError) {
      console.error("❌ Cart Clear Error:", cartClearError.message);
    }

    // -------------------------------------------------------------
    // Send Order Notification Email via Resend
    // -------------------------------------------------------------
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Posterly <orders@posterly.co.in>",
        to: ["sauvikroy3@gmail.com"],
        subject: `New Order Received! (#${orderId})`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>New Order Confirmed!</h2>
            <p>A new order has been placed and payment successfully verified via Razorpay.</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer ID:</strong> ${user.id}</p>
            <p><strong>Customer Email:</strong> ${user.email || "N/A"}</p>
            <p><strong>Customer Phone:</strong> ${user.phone ? `+${user.phone}` : "N/A"}</p>
            <p><strong>Razorpay Payment ID:</strong> ${razorpay_payment_id}</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #888;">Automated notification from your Posterly backend.</p>
          </div>
        `,
      });

      if (emailError) {
        console.error("❌ Resend API Error:", emailError);
      } else {
        console.log("✅ Resend Email Dispatched ID:", emailData?.id);
      }
    } catch (emailErr) {
      console.error("❌ Resend Network/Execution Error:", emailErr);
    }

    // -------------------------------------------------------------
    // WhatsApp order confirmation to the customer (AiSensy)
    // -------------------------------------------------------------
    try {
      const { data: addr } = await admin
        .from("user_address")
        .select("first_name, phone_dial_code, phone_number")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      // select("*") so a wrong total column name can't make the whole query fail
      const { data: ord } = await admin
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      // Prefer the delivery contact number, fall back to the number they logged in with
      const rawPhone = addr?.phone_number
        ? `${addr.phone_dial_code ?? ""}${addr.phone_number}`
        : user.phone ?? "";
      let destination = rawPhone.replace(/\D/g, "");
      if (destination.length === 10) destination = `91${destination}`;

      // ⚠️ Adjust to your real total column; these are guesses
      const total = ord?.total_amount 
      if (!destination) {
        console.log("📲 WA: skipped, no phone number for this customer");
      } else if (!ord?.order_number || total == null) {
        console.warn("📲 WA: skipped, missing order_number or total. Order columns:", Object.keys(ord ?? {}));
      } else {
        
        const result = await sendAiSensyCampaign({
          campaignName: process.env.AISENSY_ORDER_CAMPAIGN || "Order_Comfirmation_Campaign",
          destination,
          userName: addr?.first_name || "Customer",
          source: "order-confirmation",
          // Same order as the template: {{1}} name, {{2}} order number, {{3}} amount
          templateParams: [
            addr?.first_name || "there",
            String(ord.order_number),
            Number(total).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
          ],
        });
        console.log("📲 WA: AiSensy response", result);
      }
    } catch (waErr) {
      console.error("❌ WhatsApp Error:", waErr);
    }

    return NextResponse.json({ success: true, message: "Payment verified.", orderId }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Verify Payment Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}