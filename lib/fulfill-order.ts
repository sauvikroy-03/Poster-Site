import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { sendAiSensyCampaign } from "@/lib/aisensy";
import { isCustomPosterConfig } from "@/lib/custom-poster";
import {
  buildCustomOrderItemUpdate,
  deleteR2Keys,
  getR2Config,
  promoteCustomOrderAssets,
} from "@/lib/custom-poster-server";

const resend = new Resend(process.env.RESEND_API_KEY || process.env.Resend_API_KEY);

interface FulfillParams {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  gatewayAmountInPaise?: number | null;
}

export async function fulfillCapturedOrder({
  orderId,
  razorpayPaymentId,
  razorpaySignature,
  gatewayAmountInPaise,
}: FulfillParams) {
  const admin = getSupabaseAdmin();

  // 1. Fetch order first to verify amount if provided by gateway webhook
  const { data: orderRow, error: orderFetchError } = await admin
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderFetchError || !orderRow) {
    throw new Error(`Order lookup failed: ${orderFetchError?.message || "Not found"}`);
  }

  if (typeof gatewayAmountInPaise === "number") {
    const expectedPaise = Math.round(Number(orderRow.total_amount) * 100);
    if (gatewayAmountInPaise !== expectedPaise) {
      throw new Error(
        `Amount mismatch for order ${orderId}: expected ${expectedPaise} paise, got ${gatewayAmountInPaise}`
      );
    }
  }

  // 2. ATOMIC LOCK: Only one caller (browser verify OR webhook) can transition status -> 'captured'
  const { data: lockedPayment, error: lockError } = await admin
    .from("payments")
    .update({
      gateway_payment_id: razorpayPaymentId,
      ...(razorpaySignature ? { gateway_signature: razorpaySignature } : {}),
      status: "captured",
      failure_reason: null,
    })
    .eq("order_id", orderId)
    .neq("status", "captured")
    .select("payment_id, user_id")
    .maybeSingle();

  if (lockError) {
    throw new Error(`Payment lock error: ${lockError.message}`);
  }

  // Already captured and processed by the other path
  if (!lockedPayment) {
    return { alreadyProcessed: true };
  }

  const userId = lockedPayment.user_id;

  // 3. Confirm Order
  const { error: orderUpdateError } = await admin
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("order_id", orderId);

  if (orderUpdateError) {
    console.error("❌ Order Update Error:", orderUpdateError.message);
    throw new Error("Failed to confirm order.");
  }

  // 4. Record Coupon Usage (idempotent)
  try {
    const couponId = (orderRow.discount_details as { coupon_id?: string } | null)?.coupon_id;

    if (orderRow.coupon_code && couponId) {
      const { data: existingUsage } = await admin
        .from("coupon_usages")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existingUsage) {
        const { error: usageError } = await admin.from("coupon_usages").insert({
          coupon_id: couponId,
          user_id: userId,
          order_id: orderId,
          discount_applied: Math.round(Number(orderRow.discount_amount)),
        });
        if (usageError) console.error("❌ Coupon Usage Insert Error:", usageError.message);
      }
    }
  } catch (couponErr) {
    console.error("❌ Coupon Usage Error:", couponErr);
  }

  // 5. Promote pending custom poster files & slice 3-panel splits
  const { data: orderedItems } = await admin
    .from("order_items")
    .select("order_item_id, prod_name, prod_size, prod_material, quantity, custom_config")
    .eq("order_id", orderId);

  const pendingKeysToDelete: string[] = [];
  const promotedConfigs = new Map<
    string,
    ReturnType<typeof buildCustomOrderItemUpdate>["custom_config"]
  >();

  for (const item of orderedItems ?? []) {
    if (!isCustomPosterConfig(item.custom_config)) continue;
    try {
      const { updatedConfig, pendingKeysToDelete: keys } = await promoteCustomOrderAssets({
        orderId,
        orderItemId: item.order_item_id,
        custom: item.custom_config,
      });
      const updatePayload = buildCustomOrderItemUpdate(updatedConfig);
      const { error: itemUpdateErr } = await admin
        .from("order_items")
        .update(updatePayload)
        .eq("order_item_id", item.order_item_id);

      if (itemUpdateErr) {
        console.error("❌ Custom Order Item Update Error:", itemUpdateErr.message);
      } else {
        promotedConfigs.set(item.order_item_id, updatePayload.custom_config);
        pendingKeysToDelete.push(...keys);
      }
    } catch (promoteErr) {
      console.error("❌ Custom Order Asset Promotion Error:", promoteErr);
    }
  }

  if (pendingKeysToDelete.length > 0) {
    const r2Cfg = getR2Config();
    if (r2Cfg) {
      await deleteR2Keys(r2Cfg.bucketName, pendingKeysToDelete);
    }
  }

  // 6. Clear the user's cart
  const { error: cartClearError } = await admin
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (cartClearError) {
    console.error("❌ Cart Clear Error:", cartClearError.message);
  }

  // Fetch user profile for notifications
  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const customer = userData?.user;

  // 7. Send Order Notification Email via Resend
  try {
    const customItemsHtml = (orderedItems ?? [])
      .map((it) => {
        const cfg = promotedConfigs.get(it.order_item_id) ?? it.custom_config;
        if (!isCustomPosterConfig(cfg)) return "";
        const panelLinksHtml = cfg.panel_urls?.length
          ? `<p style="margin: 0 0 4px;">Split Panels: ${cfg.panel_urls
              .map((url, idx) => `<a href="${url}">Panel ${idx + 1}</a>`)
              .join(" &nbsp;|&nbsp; ")}</p>`
          : "";
        return `
          <div style="margin: 8px 0; padding: 10px; border: 1px solid #ddd; background: #fafafa;">
            <p style="margin: 0 0 4px;"><strong>${it.prod_name}</strong> (Qty: ${it.quantity})</p>
            <p style="margin: 0 0 4px;">Size: ${it.prod_size ?? cfg.size_label} | Paper: ${it.prod_material ?? cfg.material} | Orientation: ${cfg.orientation}${cfg.split ? ` | Split: ${cfg.split_pieces} panels (${cfg.split_lines} cuts)` : ""}</p>
            <p style="margin: 0 0 4px;"><a href="${cfg.preview_url}">Cropped Preview</a> &nbsp;|&nbsp; <a href="${cfg.original_url}">Original Print File</a></p>
            ${panelLinksHtml}
            <p style="margin: 0; font-size: 11px; color: #666;">Fit: zoom=${cfg.fit.zoom.toFixed(3)}, x=${cfg.fit.x.toFixed(4)}, y=${cfg.fit.y.toFixed(4)}, turns=${cfg.fit.turns}, flip=${cfg.fit.flip}</p>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Posterly <orders@posterly.co.in>",
      to: ["sauvikroy3@gmail.com"],
      subject: `New Order Received! (#${orderRow.order_number || orderId})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>New Order Confirmed!</h2>
          <p>A new order has been placed and payment successfully verified via Razorpay.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>Order Number:</strong> ${orderRow.order_number || orderId}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer ID:</strong> ${userId}</p>
          <p><strong>Customer Email:</strong> ${customer?.email || "N/A"}</p>
          <p><strong>Customer Phone:</strong> ${customer?.phone ? `+${customer.phone}` : "N/A"}</p>
          <p><strong>Razorpay Payment ID:</strong> ${razorpayPaymentId}</p>
          ${customItemsHtml}
          <p><strong>Order Link:</strong> <a href="https://posterly-admin.vercel.app/order/${orderId}">View Order Details</a></p>
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

  // 8. WhatsApp order confirmation to the customer (AiSensy)
  try {
    const { data: addr } = await admin
      .from("user_address")
      .select("first_name, phone_dial_code, phone_number")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    const rawPhone = addr?.phone_number
      ? `${addr.phone_dial_code ?? ""}${addr.phone_number}`
      : customer?.phone ?? "";
    let destination = rawPhone.replace(/\D/g, "");
    if (destination.length === 10) destination = `91${destination}`;

    const total = orderRow.total_amount;
    if (!destination) {
      console.log("📲 WA: skipped, no phone number for this customer");
    } else if (!orderRow.order_number || total == null) {
      console.warn("📲 WA: skipped, missing order_number or total.");
    } else {
      const result = await sendAiSensyCampaign({
        campaignName: process.env.AISENSY_ORDER_CAMPAIGN || "Order_Comfirmation_Campaign",
        destination,
        userName: addr?.first_name || "Customer",
        source: "order-confirmation",
        templateParams: [
          addr?.first_name || "there",
          String(orderRow.order_number),
          Number(total).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
        ],
      });
      console.log("📲 WA: AiSensy response", result);
    }
  } catch (waErr) {
    console.error("❌ WhatsApp Error:", waErr);
  }

  return { alreadyProcessed: false };
}