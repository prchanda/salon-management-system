"use client";

import { useState } from "react";
import type { BusinessReportMonth } from "@/lib/types";

function inr(v: number) {
  return `₹${Math.round(v ?? 0).toLocaleString("en-IN")}`;
}

/**
 * Stacked monthly revenue bars (service + shop), built with plain HTML/CSS so
 * it stays crisp and responsive without a charting dependency. The current
 * month also shows a dashed "projected" headroom based on the run-rate.
 */
export function RevenueTrendChart({
  months,
  projected,
}: {
  months: BusinessReportMonth[];
  projected: number;
}) {
  const [active, setActive] = useState<number | null>(null);

  const maxVal = Math.max(
    1,
    ...months.map((m) => m.totalRevenue),
    projected
  );

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-3" style={{ height: 220 }}>
        {months.map((m, i) => {
          const total = m.serviceRevenue + m.productRevenue;
          const totalH = (total / maxVal) * 100;
          const projH = m.isCurrent ? (projected / maxVal) * 100 : 0;
          const prodShare = total > 0 ? (m.productRevenue / total) * 100 : 0;
          const svcShare = total > 0 ? (m.serviceRevenue / total) * 100 : 100;

          return (
            <div
              key={m.month}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
            >
              {/* Projected headroom for the in-progress month. */}
              {m.isCurrent && projH > totalH && (
                <div
                  className="absolute bottom-0 z-0 w-full max-w-[2.75rem] rounded-t border border-dashed border-gold-600/70"
                  style={{ height: `${projH}%` }}
                />
              )}

              <div
                className={`relative z-10 flex w-full max-w-[2.75rem] flex-col justify-end overflow-hidden rounded-t transition-opacity ${
                  active === null || active === i ? "" : "opacity-40"
                }`}
                style={{ height: `${totalH}%`, minHeight: total > 0 ? 4 : 0 }}
              >
                <div
                  className="w-full bg-gold-500"
                  style={{ height: `${prodShare}%` }}
                />
                <div
                  className="w-full bg-ink-900"
                  style={{ height: `${svcShare}%` }}
                />
              </div>

              {active === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-40 -translate-x-1/2 rounded-lg bg-ink-900 p-2.5 text-[11px] text-cream-50 shadow-soft">
                  <p className="font-semibold">{m.label}</p>
                  <p className="mt-1">Total {inr(total)}</p>
                  <p className="text-cream-100/70">Service {inr(m.serviceRevenue)}</p>
                  <p className="text-cream-100/70">Shop {inr(m.productRevenue)}</p>
                  {m.isCurrent && projected > total && (
                    <p className="mt-1 text-gold-300">
                      Projected {inr(projected)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {months.map((m) => (
          <div
            key={m.month}
            className={`flex-1 text-center text-[10px] uppercase tracking-wide ${
              m.isCurrent ? "font-semibold text-ink-900" : "text-ink-500"
            }`}
          >
            {m.label.split(" ")[0]}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-900" />
          Service
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold-500" />
          Shop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-gold-600/70" />
          Projected
        </span>
      </div>
    </div>
  );
}
