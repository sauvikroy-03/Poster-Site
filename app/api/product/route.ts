import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      prod_id,
      prod_name,
      prod_slug,
      prod_category,
      prod_images,
      prod_preview_image,
      hero_visible,
      hero_order,
      product_variants (
        variant_id,
        prod_size,
        prod_material,
        prod_price,
        compare_at_price,
        sku,
        is_in_stock
      )
    `
    )
    .eq("prod_is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 200 });
}
