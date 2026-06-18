"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Announcement } from "@/lib/types";

const THEME: Record<
  Announcement["theme"],
  { bar: string; cta: string; close: string }
> = {
  gold: {
    bar: "bg-gold-500 text-ink-900",
    cta: "border-ink-900/30 hover:bg-ink-900 hover:text-gold-500",
    close: "hover:bg-ink-900/10",
  },
  ink: {
    bar: "bg-ink-900 text-cream-100",
    cta: "border-cream-100/40 hover:bg-cream-100 hover:text-ink-900",
    close: "hover:bg-cream-100/15",
  },
  blush: {
    bar: "bg-blush-200 text-ink-900",
    cta: "border-ink-900/30 hover:bg-ink-900 hover:text-blush-200",
    close: "hover:bg-ink-900/10",
  },
};

function dismissKey(a: Announcement) {
  return `announcement-dismissed:${a.updatedAt}`;
}

export function AnnouncementBar({
  announcement,
}: {
  announcement: Announcement;
}) {
  // Start visible (the common case) and hide in an effect if this exact
  // announcement was already dismissed. Keying on updatedAt means editing the
  // message re-shows the bar to everyone who previously dismissed it.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissKey(announcement)) === "1") {
        setVisible(false);
      }
    } catch {
      // localStorage may be unavailable (private mode) — just show the bar.
    }
  }, [announcement]);

  if (!visible) return null;

  const theme = THEME[announcement.theme] ?? THEME.gold;
  const href = announcement.ctaHref ?? "";
  const isInternal = href.startsWith("/");

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(announcement), "1");
    } catch {
      // Ignore — dismissal just won't persist.
    }
    setVisible(false);
  };

  return (
    <div className={theme.bar} role="region" aria-label="Site announcement">
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <p className="flex-1 text-center font-medium leading-snug sm:text-[0.95rem]">
          {announcement.message}
          {announcement.ctaLabel && href ? (
            isInternal ? (
              <Link
                href={href}
                className={`ml-3 inline-block whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-widest transition ${theme.cta}`}
              >
                {announcement.ctaLabel}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`ml-3 inline-block whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-widest transition ${theme.cta}`}
              >
                {announcement.ctaLabel}
              </a>
            )
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className={`-mr-1 shrink-0 rounded-full p-1.5 transition ${theme.close}`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
