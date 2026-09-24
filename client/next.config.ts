import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/profile",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
