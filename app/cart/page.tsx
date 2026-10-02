import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Item, { CartItemData } from "@/components/Cart/Item";
import DefaultAddress from "@/components/Cart/DefaultAddress";
import CheckoutButton from "@/components/Cart/CheckoutButton";

async function getCartItems(): Promise<CartItemData[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return [];

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

  if (authError || !user) return [];

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

async function CartContent() {
  const cartItems = await getCartItems();

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product_variants.prod_price);
    return sum + price * item.quantity;
  }, 0);

  const deliveryCharge = cartItems.length === 0 ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border bg-card p-8 text-center shadow-[4px_4px_0_0_var(--border)]">
        <p className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
          YOUR CART IS EMPTY // NO ITEMS REGISTERED
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      {/* Item list */}
      <div className="flex flex-col border-2 border-border bg-card px-5 shadow-[4px_4px_0_0_var(--border)] lg:col-span-2">
        {cartItems.map((item) => (
          <Item key={item.cart_id} item={item} />
        ))}
      </div>

      {/* Right column: Address + Summary */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]">
          <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
            Deliver To
          </h2>
          <DefaultAddress />
        </div>

        <div className="flex flex-col gap-5 border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]">
          <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
            Order Summary
          </h2>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Subtotal</span>
              <span className="font-bold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Delivery Fee</span>
              <span className="font-bold text-foreground">
                {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 border-border pt-4 font-mono">
            <span className="text-sm font-black uppercase text-foreground">Total</span>
            <span className="text-xl font-black text-foreground">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Promo code */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="PROMO CODE"
                className="w-full border-2 border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex-shrink-0 border-2 border-border bg-secondary px-5 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-secondary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-muted"
            >
              Apply
            </button>
          </div>

          <CheckoutButton />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="font-bold text-foreground">Cart</span>
        </div>

        <h1 className="mb-8 font-mono text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
          Your Cart
        </h1>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="flex h-64 animate-pulse flex-col border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)] lg:col-span-2" />
              <div className="flex h-64 animate-pulse flex-col border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]" />
            </div>
          }
        >
          <CartContent />
        </Suspense>
      </div>
    </div>
  );
}
