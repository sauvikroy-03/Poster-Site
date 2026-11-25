import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import WishlistGrid from "@/components/Wishlist/WishlistGrid";
import { getProductRatings } from "@/lib/product-ratings";
import type ProjectDataInterface from "@/types/ItemDetails";

async function getWishlistProducts(): Promise<{
  products: ProjectDataInterface[];
  isSignedIn: boolean;
}> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { products: [], isSignedIn: false };
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
    return { products: [], isSignedIn: false };
  }

  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      id,
      prod_id,
      created_at,
      products!inner (
        prod_id,
        prod_name,
        prod_slug,
        prod_category,
        prod_description,
        prod_images,
        is_trending,
        hero_visible,
        product_variants (
          variant_id,
          prod_size,
          prod_material,
          prod_price,
          compare_at_price,
          sku,
          is_in_stock
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("products.prod_is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Wishlist Fetch Error:", error.message);
    return { products: [], isSignedIn: true };
  }

  const products: ProjectDataInterface[] = (data ?? [])
    .map((row) =>
      Array.isArray(row.products) ? row.products[0] : row.products
    )
    .filter((prod): prod is NonNullable<typeof prod> => Boolean(prod))
    .map((prod) => ({
      ...prod,
      prod_description: prod.prod_description ?? "",
    }));

  return { products, isSignedIn: true };
}

async function WishlistContent() {
  const { products, isSignedIn } = await getWishlistProducts();
  const ratings =
    products.length > 0
      ? await getProductRatings(products.map((p) => p.prod_id))
      : {};

  return (
    <WishlistGrid
      initialProducts={products}
      isSignedIn={isSignedIn}
      ratings={ratings}
    />
  );
}

export default function WishlistPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="font-bold text-foreground">Wishlist</span>
        </div>

        <h1 className="mb-8 font-mono text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
          Your Wishlist
        </h1>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]"
                />
              ))}
            </div>
          }
        >
          <WishlistContent />
        </Suspense>
      </div>
    </div>
  );
}