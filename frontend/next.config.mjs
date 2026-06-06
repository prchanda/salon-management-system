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
};

export default nextConfig;
