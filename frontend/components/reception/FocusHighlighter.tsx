"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Only simple record anchors are valid (e.g. "order-123", "appt-45"). Anything
// else is ignored, which also keeps the attribute selector injection-safe.
const VALID = /^[a-z]+-\d+$/i;

/**
 * Scrolls to and briefly highlights the record named by the `?focus=<id>`
 * query param — used when the user reaches a page by clicking a notification.
 *
 * Targets carry `data-focus-id="<id>"`. The same id may appear twice (a page
 * can render a mobile card list and a desktop table), so we highlight every
 * match and scroll to whichever is currently visible. Because the row may be
 * streamed in by Suspense, we retry for a short window until it exists.
 */
export function FocusHighlighter() {
  const params = useSearchParams();
  const focus = params.get("focus");

  useEffect(() => {
    if (!focus || !VALID.test(focus)) return;

    let cancelled = false;
    let tries = 0;
    const maxTries = 25; // ~5s at 200ms
    const timers: number[] = [];

    const visible = (el: HTMLElement) => el.getClientRects().length > 0;

    function attempt() {
      if (cancelled) return;
      const matches = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-focus-id="${focus}"]`)
      );

      if (matches.length === 0) {
        if (++tries < maxTries) {
          timers.push(window.setTimeout(attempt, 200));
        }
        return;
      }

      const target = matches.find(visible) ?? matches[0];
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      for (const el of matches) {
        // Restart the animation if it's somehow already applied.
        el.classList.remove("notif-focus");
        void el.offsetWidth;
        el.classList.add("notif-focus");
        timers.push(
          window.setTimeout(() => el.classList.remove("notif-focus"), 3000)
        );
      }
    }

    attempt();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [focus]);

  return null;
}
