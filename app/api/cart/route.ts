import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_QUANTITY = 99;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prod_id = body.prod_id ? String(body.prod_id).trim() : null;
    const variant_id = body.variant_id ? String(body.variant_id).trim() : null;
    const requestedQuantity = body.quantity ? Number(body.quantity) : 1;

    if (!prod_id || !variant_id || !Number.isFinite(requestedQuantity) || requestedQuantity < 1) {
      return NextResponse.json(
        { success: false, message: "prod_id, variant_id, and a positive quantity are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing environment variables." },
        { status: 500 }
      );
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

    // user_id comes from the session, never the request body — otherwise
    // anyone could add items to another person's cart by editing the payload.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to add items to your cart." },
        { status: 401 }
      );
    }

    // Check for an existing line for this exact (user, product, variant)
    // combination so we can increment rather than overwrite quantity.
    const { data: existing, error: fetchError } = await supabase
      .from("cart_items")
      .select("cart_id, quantity")
      .eq("user_id", user.id)
      .eq("prod_id", prod_id)
      .eq("variant_id", variant_id)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Cart Lookup Error:", fetchError.message);
      return NextResponse.json(
        { success: false, message: fetchError.message },
        { status: 400 }
      );
    }

    if (existing) {
      const newQuantity = Math.min(existing.quantity + requestedQuantity, MAX_QUANTITY);

      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("cart_id", existing.cart_id)
        .select()
        .single();

      if (error) {
        console.error("❌ Cart Update Error:", error.message);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            newQuantity < existing.quantity + requestedQuantity
              ? `Quantity capped at ${MAX_QUANTITY}.`
              : "Cart updated.",
          item: data,
        },
        { status: 200 }
      );
    }

    // No existing line — insert a fresh one.
    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        prod_id,
        variant_id,
        quantity: Math.min(requestedQuantity, MAX_QUANTITY),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Cart Insert Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Item added to cart.", item: data },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Add To Cart Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}