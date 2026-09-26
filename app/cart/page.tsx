import React from "react";
import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Item, { CartItemData } from "@/components/Cart/Item";

async function getCartItems(): Promise<CartItemData[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables.");
    return [];
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("No authenticated user — cannot fetch cart.");
    return [];
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      cart_id,
      quantity,
      created_at,
      updated_at,
      products (
        prod_id,
        prod_name,
        prod_slug,
        prod_category,
        prod_images
      ),
      product_variants (
        variant_id,
        prod_size,
        prod_material,
        prod_price,
        compare_at_price,
        sku,
        is_in_stock
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Cart Fetch Error:", error.message);
    return [];
  }

  return (data as unknown as CartItemData[]) ?? [];
}

const DELIVERY_CHARGE = 79;

export default async function CartPage() {
  const cartItems = await getCartItems();

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product_variants.prod_price);
    return sum + price * item.quantity;
  }, 0);

  const deliveryCharge = cartItems.length === 0 ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={14} />
          <span className="font-semibold text-black">Cart</span>
        </div>

        <h1 className="mb-8 text-4xl font-extrabold uppercase tracking-tight text-black sm:text-5xl">
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center">
            <p className="text-sm font-bold uppercase text-neutral-400">
              Your cart is empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Item list */}
            <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white px-5 lg:col-span-2">
              {cartItems.map((item) => (
                <Item key={item.cart_id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="text-xl font-extrabold text-black">Order Summary</h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-black">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-black">
                    {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                <span className="text-base font-bold text-black">Total</span>
                <span className="text-xl font-extrabold text-black">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Promo code */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Add promo code"
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-black"
                  />
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Apply
                </button>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-sm font-bold text-white transition-all hover:opacity-90  duration-300 ease-out hover:scale-105 cursor-pointer"
              >
                Go to Checkout
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}