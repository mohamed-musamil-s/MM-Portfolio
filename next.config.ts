import type { NextConfig } from "next";

/** Directives that hold everywhere; script/style sources are left to Next's defaults. */
const CSP_BASE = "base-uri 'self'; form-action 'self'; object-src 'none'";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: `${CSP_BASE}; frame-ancestors 'none'` },
  // Browsers ignore HSTS over plain http, so local `next dev` is unaffected.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Content Forge shows /preview/* in a same-origin frame; everything else stays unframeable.
      {
        source: "/preview/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: `${CSP_BASE}; frame-ancestors 'self'` },
        ],
      },
    ];
  },
};

export default nextConfig;
