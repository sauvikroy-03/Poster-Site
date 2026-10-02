import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 1. Deliver modern lightweight formats (AVIF saves ~20-30% over WebP)
    formats: ["image/avif", "image/webp"],

    // 2. Cache optimized images on the server for 30 days (default is only 60s)
    minimumCacheTTL: 2592000,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-3eb5a70bccdc43138f622c0c7a24343f.r2.dev",
      },
    ],
  },
};

export default nextConfig;
