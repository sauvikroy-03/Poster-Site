import { createClient } from "@supabase/supabase-js";
import ProjectDataInterface from "@/types/ItemDetails";
import { CategoryInterface } from "@/types/categoryDetails";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import TrendingPosters from "@/components/TrendingPosters";
import WhyPosterly from "@/components/WhyPosterly";
import ReviewsSection from "@/components/ReviewsSection";
import CustomPosterBanner from "@/components/CustomPosterBanner";
// Cache this page at the edge/server for 60 seconds (instant TTFB)
export const revalidate = 60;

async function getProducts(): Promise<ProjectDataInterface[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("Missing Supabase URL or Key environment variables.");
      return [];
    }

    const supabase = createClient(url, key);
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
      console.error("Failed to fetch products:", error.message);
      return [];
    }

    return (data ?? []) as unknown as ProjectDataInterface[];
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

async function getCategories(): Promise<CategoryInterface[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://posterly.co.in";
    const res = await fetch(`${baseUrl}/api/category`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Failed to fetch categories, status:", res.status);
      return [];
    }

    return (await res.json()) as CategoryInterface[];
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

export default async function Home() {
  // Fetch both products and categories in parallel on the server
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Hero initialProducts={products} />
      <CustomPosterBanner href='/customize'/>
      <FeaturedCategories initialCategories={categories} />
      <TrendingPosters products={products} />
      {/* <WhyPosterly /> */}
      <ReviewsSection />
    </div>
  );
}