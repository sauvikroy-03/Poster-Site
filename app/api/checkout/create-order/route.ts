import crypto from "crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

const DELIVERY_CHARGE = 79;
const MAX_QUANTITY = 99;

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

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomUUID().split("-")[0].toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}

interface CartRow {
  cart_id: string;
  quantity: number;
  products: {
    prod_id: string;
    prod_name: string;
    prod_slug: string;
    prod_images: string[] | null;
  } | null;
  product_variants: {
    variant_id: string;
    prod_size: string | null;
    prod_material: string | null;
    prod_price: number | string;
    sku: string | null;
    is_in_stock: boolean;
  } | null;
}

export async function POST() {
  try {
    const supabase = await getAuthedClient();
    if (!supabase) return fail("Server configuration error: Missing environment variables.", 500);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return fail("Please log in to checkout.", 401);

    // ---- Default address: the only source of truth for shipping_address ----
    const { data: address, error: addressError } = await supabase
      .from("user_address")
      .select(
        "id, first_name, last_name, email, phone_country_iso2, phone_dial_code, phone_number, address_line1, landmark, pincode, city, state, country, address_type"
      )
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();

    if (addressError) {
      console.error("❌ Checkout Address Error:", addressError.message);
      return fail(addressError.message, 400);
    }
    if (!address) return fail("Please add a delivery address before checking out.", 400);

    // ---- Cart with live prices/stock — never trust a client-supplied cart or total ----
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        `
        cart_id,
        quantity,
        products ( prod_id, prod_name, prod_slug, prod_images ),
        product_variants ( variant_id, prod_size, prod_material, prod_price, sku, is_in_stock )
      `
      )
      .eq("user_id", user.id);

    if (cartError) {
      console.error("❌ Checkout Cart Error:", cartError.message);
      return fail(cartError.message, 400);
    }
    if (!cartItems || cartItems.length === 0) return fail("Your cart is empty.", 400);

    const rows = cartItems as unknown as CartRow[];

    const outOfStock = rows.find((item) => !item.product_variants?.is_in_stock);
    if (outOfStock) {
      return fail(`"${outOfStock.products?.prod_name ?? "An item"}" is currently out of stock.`, 400);
    }

    const subtotal = rows.reduce((sum, item) => {
      const price = Number(item.product_variants?.prod_price ?? 0);
      const qty = Math.min(item.quantity, MAX_QUANTITY);
      return sum + price * qty;
    }, 0);

    if (subtotal <= 0) return fail("Invalid cart total.", 400);

    const deliveryCharge = DELIVERY_CHARGE;
    const totalAmount = subtotal + deliveryCharge;
    const orderNumber = generateOrderNumber();

    const shippingAddressSnapshot = {
      first_name: address.first_name,
      last_name: address.last_name,
      email: address.email,
      phone_country_iso2: address.phone_country_iso2,
      phone_dial_code: address.phone_dial_code,
      phone_number: address.phone_number,
      address_line1: address.address_line1,
      landmark: address.landmark,
      pincode: address.pincode,
      city: address.city,
      state: address.state,
      country: address.country,
      address_type: address.address_type,
    };

    const admin = getSupabaseAdmin();

    // ---- 1. Create the order ----
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: 0,
        total_amount: totalAmount,
        shipping_address: shippingAddressSnapshot,
      })
      .select("order_id, order_number")
      .single();

    if (orderError || !order) {
      console.error("❌ Order Insert Error:", orderError?.message);
      return fail("Failed to create order.", 500);
    }

    // ---- 2. Snapshot the line items ----
    const orderItemsPayload = rows.map((item) => {
      const price = Number(item.product_variants?.prod_price ?? 0);
      const qty = Math.min(item.quantity, MAX_QUANTITY);
      return {
        order_id: order.order_id,
        product_id: item.products?.prod_id ?? null,
        variant_id: item.product_variants?.variant_id ?? null,
        prod_name: item.products?.prod_name ?? "Unknown product",
        prod_image: item.products?.prod_images?.[0] ?? null,
        prod_size: item.product_variants?.prod_size ?? null,
        prod_material: item.product_variants?.prod_material ?? null,
        sku: item.product_variants?.sku ?? null,
        unit_price: price,
        quantity: qty,
        line_total: price * qty,
      };
    });

    const { error: itemsError } = await admin.from("order_items").insert(orderItemsPayload);

    if (itemsError) {
      console.error("❌ Order Items Insert Error:", itemsError.message);
      await admin.from("orders").delete().eq("order_id", order.order_id); // rollback
      return fail("Failed to save order items.", 500);
    }

    // ---- 3. Create the Razorpay order ----
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise: Math.round(totalAmount * 100),
        receipt: order.order_number,
        notes: { order_id: order.order_id, user_id: user.id },
      });
    } catch (rzpError) {
      console.error("❌ Razorpay Order Error:", rzpError);
      await admin.from("orders").delete().eq("order_id", order.order_id); // rollback
      return fail("Failed to initiate payment. Please try again.", 502);
    }

    // ---- 4. Record the payment attempt ----
    const { error: paymentError } = await admin.from("payments").insert({
      order_id: order.order_id,
      user_id: user.id,
      gateway: "razorpay",
      gateway_order_id: razorpayOrder.id,
      amount: totalAmount,
      currency: razorpayOrder.currency,
      status: "created",
    });

    if (paymentError) {
      console.error("❌ Payment Insert Error:", paymentError.message);
      await admin.from("orders").delete().eq("order_id", order.order_id); // rollback
      return fail("Failed to initiate payment. Please try again.", 500);
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.order_id,
        orderNumber: order.order_number,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: getRazorpayKeyId(),
        prefill: {
          name: `${address.first_name} ${address.last_name}`,
          email: address.email,
          contact: `${address.phone_dial_code}${address.phone_number}`,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("❌ Create Order Route Catch:", err);
    return fail(err instanceof Error ? err.message : "Internal server error.", 500);
  }
}