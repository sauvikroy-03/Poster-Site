import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CartItemData } from "@/components/Cart/Item";
import { CartProvider } from "@/components/Cart/CartProvider";
import CartShell from "@/components/Cart/CartShell";
import { getAvailableCoupons } from "@/lib/coupons";
import type { CouponInfo } from "@/lib/coupons-shared";

async function getCartPageData(): Promise<{
  items: CartItemData[];
  availableCoupons: CouponInfo[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return { items: [], availableCoupons: [] };

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

  if (authError || !user) return { items: [], availableCoupons: [] };

  const [cartRes, availableCoupons] = await Promise.all([
    supabase
      .from("cart_items")
      .select(`
        cart_id,
        quantity,
        created_at,
        updated_at,
        custom_config,
        products (
          prod_id,
          prod_name,
          prod_slug,
          prod_category,
          prod_images,
          prod_preview_image
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
      .order("created_at", { ascending: false }),
    getAvailableCoupons(user.id),
  ]);

  if (cartRes.error) {
    console.error("❌ Cart Fetch Error:", cartRes.error.message);
    return { items: [], availableCoupons };
  }

  return {
    items: (cartRes.data as unknown as CartItemData[]) ?? [],
    availableCoupons,
  };
}

async function CartContent() {
  const { items, availableCoupons } = await getCartPageData();
  return (
    <CartProvider initialItems={items} initialAvailableCoupons={availableCoupons}>
      <CartShell />
    </CartProvider>
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