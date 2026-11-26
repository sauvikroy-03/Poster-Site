import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { fulfillCapturedOrder } from "@/lib/fulfill-order";

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Missing RAZORPAY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("❌ Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const admin = getSupabaseAdmin();

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId: string | undefined = paymentEntity?.order_id;
      const razorpayPaymentId: string | undefined = paymentEntity?.id;
      const amountInPaise: number | undefined = paymentEntity?.amount;
      const noteOrderId: string | undefined = paymentEntity?.notes?.order_id;

      if (razorpayOrderId && razorpayPaymentId) {
        const { data: paymentRow } = await admin
          .from("payments")
          .select("order_id")
          .eq("gateway_order_id", razorpayOrderId)
          .maybeSingle();

        const targetOrderId = paymentRow?.order_id || noteOrderId;

        if (targetOrderId) {
          await fulfillCapturedOrder({
            orderId: targetOrderId,
            razorpayPaymentId,
            gatewayAmountInPaise: amountInPaise,
          });
        }
      }
    }

    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId: string | undefined = paymentEntity?.order_id;

      if (razorpayOrderId) {
        const { data: paymentRow } = await admin
          .from("payments")
          .select("payment_id, order_id, status")
          .eq("gateway_order_id", razorpayOrderId)
          .maybeSingle();

        if (paymentRow && paymentRow.status !== "captured") {
          await admin
            .from("payments")
            .update({
              status: "failed",
              failure_reason: paymentEntity?.error_description || "Payment failed at gateway.",
            })
            .eq("payment_id", paymentRow.payment_id)
            .neq("status", "captured");

          await admin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("order_id", paymentRow.order_id)
            .neq("payment_status", "paid");
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Razorpay Webhook Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}