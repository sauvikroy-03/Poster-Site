import ProjectDataInterface from "@/types/ItemDetails";
import { CategoryInterface } from "@/types/categoryDetails";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import TrendingPosters from "@/components/TrendingPosters";
import WhyPosterly from "@/components/WhyPosterly";
import ReviewsSection from "@/components/ReviewsSection";

// Cache this page at the edge/server for 60 seconds (instant TTFB)
export const revalidate = 60;

async function getProducts(): Promise<ProjectDataInterface[]> {
  try {
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
      <FeaturedCategories initialCategories={categories} />
      <TrendingPosters products={products} />
      <WhyPosterly />
      <ReviewsSection />
    </div>
  );
}