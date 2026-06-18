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

// Stable DOM id so the pre-paint script can find and hide the bar.
const BAR_ID = "announcement-bar";

function dismissKey(a: Announcement) {
  return `announcement-dismissed:${a.updatedAt}`;
}

/**
 * Announcements are time-windowed. The server already filters by the window,
 * but a page can be served from a slightly stale ISR/CDN cache around the
 * start/end boundary — so re-check on the client and hide the bar if we're
 * outside the window. This keeps the bar consistent across devices instead of
 * lingering (or appearing early) on whichever cache a device happened to hit.
 */
function isWithinWindow(a: Announcement, now: number) {
  const start = a.startsAt ? Date.parse(a.startsAt) : NaN;
  const end = a.endsAt ? Date.parse(a.endsAt) : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now >= end) return false;
  return true;
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
        return;
      }
    } catch {
      // localStorage may be unavailable (private mode) — just show the bar.
    }
    // Hide if a stale cache served us a bar that is outside its time window.
    if (!isWithinWindow(announcement, Date.now())) {
      setVisible(false);
    }
  }, [announcement]);

  if (!visible) return null;

  const theme = THEME[announcement.theme] ?? THEME.gold;
  const href = announcement.ctaHref ?? "";
  const isInternal = href.startsWith("/");
  const key = dismissKey(announcement);

  // Runs synchronously while the HTML is parsed — before the first paint — so a
  // previously dismissed bar is hidden instantly instead of flashing visible
  // for a frame until the hydration effect above runs.
  const noFlashScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(
    key
  )})==="1"){var e=document.getElementById(${JSON.stringify(
    BAR_ID
  )});if(e){e.style.display="none";}}}catch(e){}})();`;

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Ignore — dismissal just won't persist.
    }
    setVisible(false);
  };

  return (
    <div
      id={BAR_ID}
      className={theme.bar}
      role="region"
      aria-label="Site announcement"
    >
      <script
        dangerouslySetInnerHTML={{ __html: noFlashScript }}
        suppressHydrationWarning
      />
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <p className="flex-1 text-left font-medium leading-snug sm:text-center sm:text-[0.95rem]">
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
