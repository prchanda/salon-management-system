"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin top-of-viewport progress bar that fires on every client-side
 * navigation (Link click, router.push, form GET submit) so the user
 * gets immediate feedback instead of feeling like the browser is hung.
 *
 * - Start: intercepts left-clicks on same-origin <a> elements that
 *   point to a different URL.
 * - Tick: animates from 8% → ~85% over ~2s so the bar keeps moving
 *   while the server is fetching/rendering.
 * - Finish: when the new pathname or search params land, jumps to
 *   100% and fades out.
 * - Safety: auto-hides after 15s in case the navigation is cancelled
 *   or the URL never changes.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);
  const safetyRef = useRef<number | null>(null);

  // Stable key for the current URL so the finish-effect fires on any change.
  const urlKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const clearTimers = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (hideRef.current) {
      window.clearTimeout(hideRef.current);
      hideRef.current = null;
    }
    if (safetyRef.current) {
      window.clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  };

  const start = () => {
    clearTimers();
    setVisible(true);
    setProgress(8);
    // Creep up toward 85% so the bar always looks alive while we wait.
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p === null) return 8;
        if (p >= 85) return p;
        // Slow down as we approach the ceiling.
        const remaining = 85 - p;
        return Math.min(85, p + Math.max(1, remaining * 0.12));
      });
    }, 180);
    // Auto-abandon after 15s so a stuck bar never lingers forever.
    safetyRef.current = window.setTimeout(() => finish(), 15000);
  };

  const finish = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRef.current) {
      window.clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setProgress(100);
    hideRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(null);
    }, 250);
  };

  // Intercept link clicks to start the bar the instant the user clicks.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Ignore non-primary clicks and modified clicks (new tab, etc.).
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Skip explicit downloads, new-tab links, and non-http schemes.
      if (
        anchor.hasAttribute("download") ||
        anchor.target === "_blank" ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const sameUrl =
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (sameUrl) return;
      start();
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  // Finish whenever the URL changes (covers Link, router.push, form GET).
  useEffect(() => {
    if (visible) finish();
    // We intentionally depend only on the URL — `visible` is read via closure
    // and we don't want to re-run when the bar shows/hides.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  useEffect(() => clearTimers, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div
        className="h-full bg-gold-500 shadow-[0_0_10px_rgba(181,145,110,0.7)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress ?? 0}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
