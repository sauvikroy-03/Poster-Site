import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://posterly.co.in"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/cart", "/wishlist", "/Upload", "/api/", "/review/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}