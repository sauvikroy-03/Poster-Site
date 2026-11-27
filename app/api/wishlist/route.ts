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

// Fetch all wishlisted products (or just prod_ids when ?idsOnly=true)
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: true, items: [], ids: [] }, { status: 200 });
    }

    const idsOnly = new URL(request.url).searchParams.get("idsOnly") === "true";

    if (idsOnly) {
      const { data, error } = await supabase
        .from("wishlists")
        .select("prod_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Wishlist IDs Fetch Error:", error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { success: true, ids: (data ?? []).map((row) => row.prod_id) },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        id,
        prod_id,
        created_at,
        products (
          prod_id,
          created_at,
          prod_name,
          prod_slug,
          prod_category,
          prod_images,
          prod_preview_image,
          prod_is_active,
          product_variants (*)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Wishlist Fetch Error:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, items: data ?? [] }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Get Wishlist Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// Toggle product in wishlist (adds if missing, removes if already wishlisted)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prod_id = body.prod_id ? String(body.prod_id).trim() : null;

    if (!prod_id) {
      return NextResponse.json(
        { success: false, message: "prod_id is required." },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to save items to your wishlist." },
        { status: 401 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("prod_id", prod_id)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Wishlist Lookup Error:", fetchError.message);
      return NextResponse.json({ success: false, message: fetchError.message }, { status: 400 });
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("❌ Wishlist Remove Error:", deleteError.message);
        return NextResponse.json({ success: false, message: deleteError.message }, { status: 400 });
      }

      return NextResponse.json(
        { success: true, wishlisted: false, message: "Removed from wishlist." },
        { status: 200 }
      );
    }

    const { data, error: insertError } = await supabase
      .from("wishlists")
      .insert({ user_id: user.id, prod_id })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Wishlist Insert Error:", insertError.message);
      return NextResponse.json({ success: false, message: insertError.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, wishlisted: true, message: "Added to wishlist.", item: data },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Toggle Wishlist Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}