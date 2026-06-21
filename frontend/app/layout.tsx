import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NavigationProgress } from "@/components/NavigationProgress";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

const SITE_URL = "https://www.mrandmrscuts.in";
const SITE_NAME = "Mr. & Mrs. Cuts Salon";
const SITE_DESCRIPTION =
  "A boutique salon in Garia, Kolkata where craft meets care. Bespoke hair, skin and nail services by senior specialists. Book your appointment online.";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mr. & Mrs. Cuts Salon — Atelier of Hair, Skin & Nails",
    template: "%s · Mr. & Mrs. Cuts Salon",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "salon in Garia",
    "salon in Kolkata",
    "hair salon Kolkata",
    "haircut Garia",
    "unisex salon Kolkata",
    "hair colouring",
    "skin care salon",
    "nail studio Kolkata",
    "bridal makeup Kolkata",
    "Mr. & Mrs. Cuts",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Mr. & Mrs. Cuts Salon — Atelier of Hair, Skin & Nails",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mr. & Mrs. Cuts Salon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr. & Mrs. Cuts Salon — Atelier of Hair, Skin & Nails",
    description: SITE_DESCRIPTION,
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
    </html>
  );
}
