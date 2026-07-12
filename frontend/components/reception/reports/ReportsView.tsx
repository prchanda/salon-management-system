"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const RANGES = [
  { months: 3, label: "3M" },
  { months: 6, label: "6M" },
  { months: 12, label: "12M" },
];

interface Props {
  months: number;
  /** Skeleton shown in place of the body while a new range is loading. */
  skeleton: React.ReactNode;
  /** The resolved report body for the current range. */
  children: React.ReactNode;
}

/**
 * Frame for the business report: header + range selector (3 / 6 / 12 months) +
 * body. Navigating routes through React's useTransition; while the next range's
 * data is loading we swap the BODY for a skeleton (mirroring the day-summary
 * view) so the loader reads inline with the content rather than doing nothing.
 */
export function ReportsView({ months, skeleton, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    if (!pending) setTarget(null);
  }, [pending]);

  function go(next: number) {
    if (pending || next === months) return;
    setTarget(next);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("months", String(next));
    startTransition(() => router.push(`/reception/reports?${params.toString()}`));
  }

  return (
    <div className="space-y-8">
      {pending && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-gold-600/20">
          <div className="h-full w-1/3 animate-[loader_1.2s_ease-in-out_infinite] bg-gold-600" />
          <style>{`@keyframes loader { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }`}</style>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Business reports</p>
          <h1 className="mt-2 font-serif text-3xl text-ink-900">
            Trends &amp; projections
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Revenue momentum across the last {months} months.
          </p>
        </div>

        <div
          className={`inline-flex rounded-xl border border-ink-900/10 bg-cream-50 p-1 transition-opacity ${
            pending ? "opacity-60" : ""
          }`}
          aria-busy={pending}
        >
          {RANGES.map((r) => {
            const active = r.months === months;
            const isPending = target === r.months;
            return (
              <button
                key={r.months}
                type="button"
                disabled={pending}
                onClick={() => go(r.months)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors disabled:cursor-wait ${
                  active
                    ? "bg-ink-900 text-cream-50"
                    : "text-ink-500 hover:text-ink-900"
                } ${isPending ? "animate-pulse" : ""}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {pending ? skeleton : children}
    </div>
  );
}
