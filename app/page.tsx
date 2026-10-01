import ProjectDataInterface from "@/types/ItemDetails";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import TrendingPosters from "@/components/TrendingPosters";
import WhyPosterly from "@/components/WhyPosterly";
import ReviewsSection from "@/components/ReviewsSection";

// Cache this page at the edge/server for 60 seconds (instant TTFB)
export const revalidate = 60;

async function getProducts(): Promise<ProjectDataInterface[]> {
  try {
    // TIP: If you have a direct Supabase or DB query function (e.g. getProductsFromDb()), 
    // calling that directly here is even faster than HTTP fetch!
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://posterly.co.in";
    const res = await fetch(`${baseUrl}/api/product`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Failed to fetch products, status:", res.status);
      return [];
    }

    return (await res.json()) as ProjectDataInterface[];
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* Pass the server-fetched products into Hero */}
      <Hero initialProducts={products} />
      <FeaturedCategories />
      <TrendingPosters />
      <WhyPosterly />
      <ReviewsSection />
    </div>
  );
}