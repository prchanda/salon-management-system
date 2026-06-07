/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the Next.js server returns gzip/br responses even when the host
  // (Azure SWA, custom Node) doesn't add it. Cheap CPU; big win for HTML/JS.
  compress: true,
  // Smaller, modern image formats served automatically when the browser
  // negotiates them. AVIF first, then WebP, then the original.
  images: {
    formats: ["image/avif", "image/webp"],
    // Cap the upper bucket at 1280 (was 3840 by default). The hero / card
    // images on this site never display wider than ~640 CSS px on a phone
    // and ~720 CSS px on desktop, so even a 2× DPR screen only needs 1280
    // actual px. Removing the 1920/2048/3840 buckets stops retina browsers
    // from picking a 300-450 KB AVIF variant for the LCP image, and avoids
    // the slow on-demand transform of those large sizes on Azure Functions.
    deviceSizes: [640, 750, 828, 1080, 1200, 1280],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache transformed images for 30 days at the CDN edge (default is 60s),
    // so the first cold transform is only paid once per variant.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Tree-shake heavier deps that re-export everything from a barrel file.
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  // Security headers. Defined here (rather than only in staticwebapp.config.json)
  // because this is a hybrid/SSR Next.js app on Azure Static Web Apps, where the
  // SWA globalHeaders are not reliably applied to server-rendered responses.
  // Applying them at the Next.js layer covers every response (SSR and static).
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://mrmrscuts-api.azurewebsites.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
