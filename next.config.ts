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
        hostname: "aman-raj.me",
      },
    ],
  },

  // ─── Security Response Headers ───────────────────────────────────────
  // Applied to all routes served by the Next.js frontend.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Block rendering inside iframes (clickjacking protection)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // XSS filter for legacy browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Control referrer information sent with requests
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict dangerous browser APIs
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
          },
          // Force HTTPS in production (1 year, include subdomains, preload-ready)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;

