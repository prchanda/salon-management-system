import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mr. & Mrs. Cuts Salon",
    short_name: "Mr. & Mrs. Cuts",
    description:
      "A boutique salon where craft meets care. Bespoke hair, skin and nail services by senior specialists in Garia, Kolkata.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#1a1a1a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
