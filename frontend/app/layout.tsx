import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import { SALON } from "@/lib/salon";
import "./globals.css";

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

// LocalBusiness (HairSalon) structured data — drives Google rich results and
// the local map pack (hours, address, phone, ratings, social profiles).
const salonJsonLd = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": `${SITE_URL}/#salon`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/images/og-image.jpg`,
  logo: `${SITE_URL}/icon.png`,
  telephone: SALON.phone,
  email: SALON.email,
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  address: {
    "@type": "PostalAddress",
    streetAddress: "157/2, Monihar Apartment (Ground Floor), Gostotala, Garia",
    addressLocality: "Kolkata",
    addressRegion: "West Bengal",
    addressCountry: "IN",
  },
  hasMap: SALON.mapsUrl,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "21:00",
    },
  ],
  sameAs: [SALON.instagram, SALON.facebook],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(salonJsonLd) }}
        />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
