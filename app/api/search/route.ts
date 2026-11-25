import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const includeCategories = searchParams.get("categories") === "true";

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.rpc("search_products", {
      search_query: q,
      result_limit: 8,
    });

    if (error) {
      console.error("❌ Search RPC Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    const results = (data ?? []).map((item: {
      prod_id: string;
      prod_name: string;
      prod_slug: string;
      prod_category: string;
      prod_images: string[];
      prod_preview_image: string;
      min_price: number | null;
    }) => ({
      prod_id: item.prod_id,
      prod_name: item.prod_name,
      prod_slug: item.prod_slug,
      prod_category: item.prod_category,
      image: item.prod_preview_image || item.prod_images?.[0] || "/placeholder.jpg",
      price: item.min_price !== null ? Number(item.min_price) : null,
    }));

    let categories: string[] | undefined;
    if (includeCategories) {
      const { data: catRows } = await supabase
        .from("products")
        .select("prod_category")
        .eq("prod_is_active", true);

      categories = Array.from(
        new Set((catRows ?? []).map((r) => r.prod_category).filter(Boolean))
      ).slice(0, 8);
    }

    return NextResponse.json(
      { success: true, results, ...(categories ? { categories } : {}) },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Search Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}