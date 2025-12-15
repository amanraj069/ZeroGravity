import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // buildActivity: false,
    // buildActivityPosition: "bottom-right",
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.githubassets.com",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "www.perplexity.ai",
      },
      {
        protocol: "https",
        hostname: "cdn.openai.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "portfolio-aman-raj.vercel.app",
      },
    ],
  },
};

export default nextConfig;
