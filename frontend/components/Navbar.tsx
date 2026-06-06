"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { SALON, telLink, waLink } from "@/lib/salon";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/reviews", label: "Reviews" },
  { href: "/blog", label: "Journal" },
  { href: "/book", label: "Book" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/reception")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden bg-ink-900 text-cream-100 md:block">
        <div className="container-page flex h-9 items-center justify-between text-[11px] tracking-widest">
          <span className="uppercase">{SALON.hours}</span>
          <div className="flex items-center gap-6 uppercase">
            <a href={telLink()} className="hover:text-gold-400">
              {SALON.phoneDisplay}
            </a>
            <a href={`mailto:${SALON.email}`} className="hover:text-gold-400">
              {SALON.email}
            </a>
          </div>
        </div>
      </div>

      <div
        className={`border-b transition ${
          scrolled
            ? "border-ink-900/10 bg-cream-50/95 backdrop-blur-md"
            : "border-transparent bg-cream-50"
        }`}
      >
        <div className="container-page flex h-20 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 font-serif text-2xl tracking-wide text-ink-900"
            onClick={() => setOpen(false)}
          >
            <Logo size={44} />
            <span>
              Mr. &amp; Mrs. Cuts <span className="italic text-gold-600">Salon</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative pb-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    active ? "text-ink-900" : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-gold-600 transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/book" className="btn-primary !py-2.5">
              Book Online
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <a
              href={telLink()}
              aria-label={`Call ${SALON.phoneDisplay}`}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink-900 transition hover:border-gold-600 hover:text-gold-600 sm:hidden"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call
            </a>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              className="inline-flex items-center justify-center rounded-md p-2 text-ink-900"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                ) : (
                  <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-900/10 bg-cream-50 lg:hidden">
          <nav className="container-page flex flex-col py-4">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-b border-ink-900/5 py-4 text-sm font-semibold uppercase tracking-widest ${
                    active ? "text-ink-900" : "text-ink-600"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-4 w-[3px] rounded-full bg-gold-600 transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="btn-primary"
              >
                Book Online
              </Link>
              <a href={telLink()} className="btn-outline">
                Call {SALON.phoneDisplay}
              </a>
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                WhatsApp Us
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
