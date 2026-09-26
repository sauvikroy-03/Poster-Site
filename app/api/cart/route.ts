import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_QUANTITY = 99;

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
        { success: false, message: "You must be signed in to add items to your cart." },
        { status: 401 }
      );
    }

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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const cart_id = body.cart_id ? String(body.cart_id).trim() : null;

    if (!cart_id) {
      return NextResponse.json(
        { success: false, message: "cart_id is required." },
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
        { success: false, message: "You must be signed in to modify your cart." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart_id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ Cart Delete Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Cart item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Item removed from cart." },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Delete Cart Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const cart_id = body.cart_id ? String(body.cart_id).trim() : null;
    const quantity = body.quantity ? Number(body.quantity) : null;

    if (!cart_id || !Number.isFinite(quantity) || quantity! < 1 || quantity! > MAX_QUANTITY) {
      return NextResponse.json(
        { success: false, message: `cart_id and a quantity between 1 and ${MAX_QUANTITY} are required.` },
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
        { success: false, message: "You must be signed in to modify your cart." },
        { status: 401 }
      );
    }

    // Scoped to this user, same belt-and-suspenders reasoning as DELETE —
    // don't rely on RLS alone to prevent updating someone else's row.
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("cart_id", cart_id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ Cart Quantity Update Error:", error.message);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Cart item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Quantity updated.", item: data },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("❌ Update Cart Route Catch:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}