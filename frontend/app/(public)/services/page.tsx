import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import { api } from "@/lib/api";
import { FALLBACK_SERVICES } from "@/lib/fallbackServices";
import {
  SERVICE_CATEGORIES,
  DEFAULT_SERVICE_CATEGORY,
} from "@/lib/serviceCategories";
import { SALON, waLink } from "@/lib/salon";
import type { Service } from "@/lib/types";

export const metadata = {
  title: "Services · Mr. & Mrs. Cuts Salon",
  description:
    "A senior-led menu of hair, skin, nail and spa treatments. Complimentary consultations on every appointment.",
};

async function safeGetServices(): Promise<Service[]> {
  try {
    const services = await api.getServices();
    return services.length > 0 ? services : FALLBACK_SERVICES;
  } catch {
    return FALLBACK_SERVICES;
  }
}

// Keyword fallback for services that don't yet have a category assigned
// (legacy rows / the static fallback list). New services set category
// explicitly from the reception admin, which always takes precedence.
const CATEGORY_KEYWORDS: { value: string; match: RegExp }[] = [
  { value: "Hair", match: /hair|cut|color|colour|blow|style|trim/i },
  { value: "Skin", match: /skin|facial|peel|glow|clean/i },
  { value: "Nails", match: /nail|mani|pedi/i },
  { value: "Spa", match: /spa|massage|body|wax/i },
];

function categoryFor(service: Service): string {
  // Prefer the explicit category when it maps to a known group.
  const explicit = SERVICE_CATEGORIES.find(
    (c) => c.value.toLowerCase() === (service.category ?? "").toLowerCase()
  );
  if (explicit) return explicit.value;
  // Fall back to keyword matching on the name.
  const guessed = CATEGORY_KEYWORDS.find((c) => c.match.test(service.serviceName));
  return guessed?.value ?? DEFAULT_SERVICE_CATEGORY;
}

const EXPERIENCE = [
  {
    title: "Complimentary consultation",
    body: "Every appointment begins with a brief conversation so the treatment is shaped to you — not to a template.",
  },
  {
    title: "Senior specialists only",
    body: "All services are performed by lead stylists and therapists with a minimum of seven years on the floor.",
  },
  {
    title: "Considered products",
    body: "We work with a small, deliberately curated shelf of professional brands — chosen for performance, not endorsement.",
  },
  {
    title: "Quiet, private rooms",
    body: "Treatment rooms are screened from the salon floor so colour, facials and spa rituals stay calm and unhurried.",
  },
];

export default async function ServicesPage() {
  const services = await safeGetServices();

  const groups: Record<string, Service[]> = {};
  for (const s of services) {
    const key = categoryFor(s);
    (groups[key] ||= []).push(s);
  }

  return (
    <>
      <section className="bg-cream-100">
        <div className="container-page py-20 sm:py-28">
          <div className="flex items-center gap-3">
            <span className="divider-gold" />
            <span className="eyebrow">The menu</span>
          </div>
          <h1 className="display mt-6 max-w-3xl">
            A considered edit of{" "}
            <span className="italic text-gold-600">services</span>.
          </h1>
          <p className="lead mt-6 max-w-2xl">
            From signature cuts to restorative facials — every treatment is
            led by a senior specialist and tailored to you. Consultations are
            always complimentary; prices are inclusive of taxes.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/book" className="btn-primary">
              Book Online
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              Book on WhatsApp
            </a>
            <a
              href={`mailto:${SALON.email}`}
              className="text-xs font-semibold uppercase tracking-widest text-ink-600 hover:text-ink-900"
            >
              Or write to us →
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page space-y-24">
          {services.length === 0 && (
            <p className="rounded-xl bg-cream-100 p-8 text-center text-sm text-ink-500">
              The menu is being refreshed. Please check back shortly.
            </p>
          )}

          {SERVICE_CATEGORIES.map((cat, index) => {
            const list = groups[cat.value];
            if (!list || list.length === 0) return null;
            return (
              <div key={cat.value} className="grid gap-12 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <span className="eyebrow">{`0${index + 1} — ${cat.tagline}`}</span>
                  <h2 className="h2 mt-3">{cat.label}</h2>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
                    {cat.blurb}
                  </p>
                </div>
                <div className="lg:col-span-8">
                  <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                    {list.map((s) => (
                      <ServiceCard key={s.id} service={s} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-cream-100">
        <div className="container-page section">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="eyebrow">The experience</span>
              <h2 className="h2 mt-3">
                Small details,{" "}
                <span className="italic text-gold-600">considered.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
                What every guest can expect, regardless of the service booked.
              </p>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
              {EXPERIENCE.map((item, i) => (
                <div key={item.title} className="border-t border-ink-900/10 pt-6">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-600">
                    {`0${i + 1}`}
                  </span>
                  <h3 className="mt-3 font-serif text-xl text-ink-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink-900 text-cream-50">
        <div className="container-page section flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
              Ready to book
            </span>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              Tell us what you have in mind. We&apos;ll take it from there.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream-200">
              Reach out on WhatsApp for the fastest reply, or call the salon
              during opening hours.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="btn-primary bg-cream-50 text-ink-900 hover:bg-gold-600 hover:text-cream-50"
            >
              Book on WhatsApp
            </a>
            <Link
              href="/blog"
              className="text-xs font-semibold uppercase tracking-widest text-cream-100 hover:text-gold-400"
            >
              Read the journal →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
