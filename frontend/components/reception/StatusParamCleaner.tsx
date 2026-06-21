"use client";

import { useEffect } from "react";

/**
 * Strips one-off status query params (e.g. `?created=1`, `?updated=5`) from the
 * URL after the page mounts, without triggering a navigation or refetch.
 *
 * The success banner is already rendered in the server HTML, so the user still
 * sees it once. Cleaning the URL afterwards means a hard refresh (or back/
 * forward) won't re-show a stale "saved!" message.
 */
export function StatusParamCleaner({ params }: { params: string[] }) {
  useEffect(() => {
    if (params.length === 0) return;

    const url = new URL(window.location.href);
    let changed = false;
    for (const key of params) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return;

    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + (url.search ? url.search : "") + url.hash
    );
  }, [params]);

  return null;
}
