import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-3eb5a70bccdc43138f622c0c7a24343f.r2.dev",
      },
    ],
  },
};

export default nextConfig;
