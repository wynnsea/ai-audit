import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // build menghasilkan .next/standalone (server.js + dependency minimal) untuk image Docker yang kecil
  output: "standalone",
  experimental: {
    agentFeedback: true,
    proxyClientMaxBodySize: "41mb"
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        // browser cukup memanggil /api/... (origin yang sama, tanpa CORS),
        // Next.js yang meneruskan ke Go service. URL Go tidak pernah sampai ke browser.
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:8081"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
