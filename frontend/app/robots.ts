import type { MetadataRoute } from "next";

const BASE_URL = "https://www.mrandmrscuts.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private staff/booking-management areas out of the index.
      disallow: ["/reception", "/bff"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
