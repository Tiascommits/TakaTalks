import type { NextConfig } from "next";

// The CSP covers framing, <base> and plugins only. A script/frame/img policy would
// need per-request nonces (making every page dynamic) or 'unsafe-inline', and would
// have to track the GoatCounter and YouTube origins; it is left out on purpose.
// Permissions-Policy leaves autoplay, encrypted-media, picture-in-picture and
// fullscreen alone, which the YouTube embed uses.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
