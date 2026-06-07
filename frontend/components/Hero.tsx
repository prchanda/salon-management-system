import Image from "next/image";
import Link from "next/link";
import { HeroReviewCard } from "@/components/HeroReviewCard";
import { waLink } from "@/lib/salon";
import type { Review } from "@/lib/types";

export function Hero({
  reviews,
  specialistCount,
}: {
  reviews?: Review[];
  specialistCount?: number;
}) {
  // Fall back to a sensible default if the staff list is unavailable so the
  // stat never renders as 0 or blank.
  const specialists = specialistCount && specialistCount > 0 ? specialistCount : 3;
  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="flex items-center gap-3">
            <span className="divider-gold" />
            <span className="eyebrow">A boutique atelier</span>
          </div>

          <h1 className="display-xl mt-6">
            Quiet luxury,
            <br />
            <span className="italic text-gold-600">crafted</span> for you.
          </h1>

          <p className="lead mt-6 max-w-md">
            Hair, skin and nails by senior specialists. Bespoke consultations,
            premium products, and a calm room where time slows down.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/book" className="btn-primary whitespace-nowrap">
              Book Online
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="btn-outline whitespace-nowrap"
            >
              WhatsApp to Book
            </a>
          </div>

          <p className="mt-4 text-xs uppercase tracking-widest text-ink-500">
            We reply within minutes during salon hours.
          </p>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink-900/10 pt-8">
            <div>
              <dt className="eyebrow">Since</dt>
              <dd className="mt-1 font-serif text-2xl text-ink-900">2017</dd>
            </div>
            <div>
              <dt className="eyebrow">Specialists</dt>
              <dd className="mt-1 font-serif text-2xl text-ink-900">
                {specialists}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Open</dt>
              <dd className="mt-1 font-serif text-2xl text-ink-900">6 days</dd>
            </div>
          </dl>
        </div>

        <div className="relative lg:col-span-6 xl:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush-100 shadow-soft sm:aspect-[5/6] lg:aspect-[4/5]">
            <Image
              src="/images/hero-homepage.jpg"
              alt="Specialist working on a guest in a calm salon interior"
              fill
              priority
              quality={70}
              // Cap the rendered width so the browser never asks for the
              // ultra-wide srcSet variant on large monitors. 720 CSS px is
              // the largest size this image is ever drawn at on desktop;
              // 2× DPR resolves to a 1280-wide source — which matches our
              // capped `deviceSizes` in next.config.mjs.
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/15 via-transparent to-transparent" />
          </div>

          <HeroReviewCard reviews={reviews} />
        </div>
      </div>
    </section>
  );
}
