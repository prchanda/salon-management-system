import Link from "next/link";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { RotatingTestimonials } from "@/components/RotatingTestimonials";
import { ServiceCard } from "@/components/ServiceCard";
import { api } from "@/lib/api";
import { SALON, telLink, waLink, buildSalonJsonLd } from "@/lib/salon";
import type { Product, Review, Service, Staff } from "@/lib/types";

// Roles that don't sit behind the chair and shouldn't be counted as
// client-facing "specialists" in the hero stat.
const NON_SPECIALIST_ROLES = new Set(["receptionist", "manager"]);

function countSpecialists(staff: Staff[]): number {
  return staff.filter(
    (s) =>
      s.isActive &&
      s.roles.some((r) => !NON_SPECIALIST_ROLES.has(r.toLowerCase()))
  ).length;
}

// Services / reviews / featured products change slowly. Let the CDN serve
// a pre-rendered page and revalidate at most every 5 minutes so first
// paint is fast on both desktop and mobile.
export const revalidate = 300;

async function safeGetServices(): Promise<Service[]> {
  try {
    return await api.getServices();
  } catch {
    return [];
  }
}

async function safeGetReviews(): Promise<Review[]> {
  try {
    return await api.getReviews(20);
  } catch {
    return [];
  }
}

async function safeGetProducts(): Promise<Product[]> {
  try {
    return await api.getProducts(8);
  } catch {
    return [];
  }
}

async function safeGetStaff(): Promise<Staff[]> {
  try {
    return await api.getStaff();
  } catch {
    return [];
  }
}

const PILLARS = [
  {
    title: "Considered craft",
    body: "Every cut, color and treatment is led by a senior specialist with at least seven years behind the chair.",
  },
  {
    title: "Quiet hospitality",
    body: "A calm room, single-use kits, fresh linen — the small things, done with care.",
  },
  {
    title: "Honest pricing",
    body: "What you see is what you pay. Consultations are always complimentary.",
  },
];

export default async function HomePage() {
  const [services, reviews, staff] = await Promise.all([
    safeGetServices().then((s) => s.slice(0, 6)),
    safeGetReviews(),
    safeGetStaff(),
  ]);
  const products = (await safeGetProducts()).slice(0, 8);
  const specialistCount = countSpecialists(staff);

  // Average star rating across published reviews — surfaced to Google as
  // AggregateRating so star ratings can appear in search results.
  const ratedReviews = reviews.filter((r) => r.rating > 0);
  const aggregateRating =
    ratedReviews.length > 0
      ? {
          ratingValue:
            ratedReviews.reduce((sum, r) => sum + r.rating, 0) /
            ratedReviews.length,
          reviewCount: ratedReviews.length,
        }
      : undefined;
  const salonJsonLd = buildSalonJsonLd(aggregateRating);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(salonJsonLd) }}
      />
      <Hero reviews={reviews} specialistCount={specialistCount} />

      <section className="border-y border-ink-900/10 bg-cream-100">
        <div className="container-page grid gap-10 py-16 sm:grid-cols-3 sm:gap-12">
          {PILLARS.map((p, i) => (
            <div key={p.title}>
              <p className="font-serif text-3xl text-gold-600">0{i + 1}</p>
              <h3 className="mt-4 font-serif text-xl text-ink-900">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="eyebrow">The menu</span>
              <h2 className="h2 mt-4">Services & honest prices.</h2>
              <p className="lead mt-5">
                A curated edit of our most-loved treatments. Every visit begins
                with a quiet consultation.
              </p>
              <Link href="/services" className="btn-ghost mt-8 inline-flex">
                See full menu <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="lg:col-span-8">
              {services.length === 0 ? (
                <p className="rounded-xl bg-cream-100 p-8 text-center text-sm text-ink-500">
                  Services will appear here once the atelier is open.
                </p>
              ) : (
                <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="border-t border-ink-900/10 bg-cream-100">
          <div className="container-page section">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <span className="eyebrow">The Shop</span>
                <h2 className="h2 mt-4">
                  Salon-curated{" "}
                  <span className="italic text-gold-600">essentials.</span>
                </h2>
                <p className="lead mt-5">
                  Skin, hair &amp; styling products our specialists actually
                  reach for. Browse the catalogue and place an order — we&apos;ll
                  call to confirm.
                </p>
              </div>
              <Link
                href="/shop"
                className="btn-ghost shrink-0 self-start lg:self-auto"
              >
                Shop everything <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="bg-ink-900 text-cream-50">
          <div className="container-page py-20 text-center sm:py-24">
            <RotatingTestimonials reviews={reviews} />
            <Link
              href="/reviews"
              className="mt-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold-400 hover:text-gold-300"
            >
              Read all reviews <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-page text-center">
          <span className="eyebrow">Reserve</span>
          <h2 className="display mt-4 mx-auto max-w-2xl">
            Your chair is <span className="italic text-gold-600">waiting.</span>
          </h2>
          <p className="lead mx-auto mt-5 max-w-xl">
            Send us a WhatsApp or give us a call — we&apos;ll confirm your slot
            in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="btn-primary whitespace-nowrap"
            >
              WhatsApp Us
            </a>
            <a
              href={telLink()}
              className="btn-outline whitespace-nowrap md:hidden"
            >
              Call {SALON.phoneDisplay}
            </a>
          </div>
          <div className="mt-6 space-y-1 text-xs uppercase tracking-widest text-ink-500">
            <p>{SALON.hours}</p>
            <a
              href={SALON.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto block max-w-md transition hover:text-gold-600"
            >
              {SALON.address}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
