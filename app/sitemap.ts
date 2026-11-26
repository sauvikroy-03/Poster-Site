import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://posterly.co.in"
).replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/categories`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/customize`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return staticRoutes;
  }

  const supabase = createClient(url, key);

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("prod_slug, updated_at, created_at")
      .eq("prod_is_active", true),
    supabase.from("categories").select("slug"),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => Boolean(c.slug))
    .map((c) => ({
      url: `${BASE_URL}/categories?category=${encodeURIComponent(c.slug)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const productRoutes: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => Boolean(p.prod_slug))
    .map((p) => ({
      url: `${BASE_URL}/product/${encodeURIComponent(p.prod_slug)}`,
      lastModified: p.updated_at || p.created_at || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}