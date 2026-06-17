import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SALON, telLink, waLink } from "@/lib/salon";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-cream-100">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:py-20">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={52} />
            <p className="font-serif text-2xl">
              Mr. &amp; Mrs. Cuts <span className="italic text-gold-400">Salon</span>
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream-100/70">
            A boutique atelier for hair, skin and nails. Considered services in
            a calm, quiet room.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={SALON.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-100/20 text-cream-100/80 transition hover:border-gold-400 hover:text-gold-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={SALON.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-100/20 text-cream-100/80 transition hover:border-gold-400 hover:text-gold-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.2v3h2.6V21h2.7z" />
              </svg>
            </a>
            <a
              href={`mailto:${SALON.email}`}
              aria-label={`Email ${SALON.email}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-100/20 text-cream-100/80 transition hover:border-gold-400 hover:text-gold-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
            Explore
          </h4>
          <ul className="mt-5 space-y-3 text-sm text-cream-100/80">
            <li>
              <Link href="/services" className="hover:text-gold-400">
                Services & Pricing
              </Link>
            </li>
            <li>
              <Link href="/reviews/new" className="hover:text-gold-400">
                Write a Review
              </Link>
            </li>
            <li>
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold-400"
              >
                WhatsApp Us
              </a>
            </li>
            <li className="md:hidden">
              <a href={telLink()} className="hover:text-gold-400">
                Call {SALON.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
            Visit
          </h4>
          <address className="mt-5 not-italic text-sm leading-relaxed text-cream-100/80">
            <a
              href={SALON.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-400"
            >
              {SALON.address}
            </a>
            <br />
            <a href={telLink()} className="hover:text-gold-400">
              {SALON.phoneDisplay}
            </a>
          </address>
          <p className="mt-4 text-xs uppercase tracking-wide text-cream-100/60">
            {SALON.hours}
          </p>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-center text-[11px] uppercase tracking-widest text-cream-100/50 sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} {SALON.name}. All rights reserved.
          </p>
          <p>Crafted with care in Kolkata</p>
        </div>
      </div>
    </footer>
  );
}
