import { Suspense } from "react";
import { api } from "@/lib/api";
import type { BusinessReport } from "@/lib/types";
import { ReportsView } from "@/components/reception/reports/ReportsView";
import { RevenueTrendChart } from "@/components/reception/reports/RevenueTrendChart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Reception" };

function formatINR(value: number) {
  return `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;
}

function clampMonths(raw?: string) {
  const n = parseInt(raw ?? "6", 10);
  if (Number.isNaN(n)) return 6;
  return Math.min(24, Math.max(3, n));
}

async function safeGetReport(months: number): Promise<BusinessReport | null> {
  try {
    return await api.getBusinessReport(months);
  } catch {
    return null;
  }
}

export default function ReportsPage({
  searchParams,
}: {
  searchParams: { months?: string };
}) {
  const months = clampMonths(searchParams.months);

  return (
    <ReportsView months={months} skeleton={<ReportSkeleton />}>
      <Suspense key={months} fallback={<ReportSkeleton />}>
        <ReportContent months={months} />
      </Suspense>
    </ReportsView>
  );
}

async function ReportContent({ months }: { months: number }) {
  const data = await safeGetReport(months);

  if (!data) {
    return (
      <div className="rounded-2xl bg-cream-50 p-10 text-center text-sm text-ink-500">
        Unable to load reports right now.
      </div>
    );
  }

  const { current, totals } = data;
  const grew = (current.momGrowthPct ?? 0) >= 0;
  const periodAvg =
    data.months.length > 0
      ? totals.totalRevenue / data.months.length
      : 0;

  const maxStaffRev = Math.max(1, ...data.topStaff.map((s) => s.revenue));
  const maxServiceRev = Math.max(1, ...data.topServices.map((s) => s.revenue));
  const paymentTotal = Math.max(
    1,
    data.paymentMix.reduce((sum, p) => sum + p.revenue, 0)
  );

  return (
    <div className="space-y-8">
      {/* ── Headline KPIs ──────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-ink-900 p-6 text-cream-50 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-cream-100/70">
            {current.label} so far
          </p>
          <p className="mt-2 font-serif text-3xl">
            {formatINR(current.totalRevenue)}
          </p>
          {current.momGrowthPct === null ? (
            <p className="mt-3 text-xs text-cream-100/70">
              No prior month to compare
            </p>
          ) : (
            <p
              className={`mt-3 inline-flex items-center gap-1 text-xs ${
                grew ? "text-emerald-300" : "text-red-300"
              }`}
            >
              <span>{grew ? "▲" : "▼"}</span>
              {Math.abs(current.momGrowthPct)}% vs {formatINR(current.prevTotalRevenue)} last month
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-gold-600 p-6 text-ink-900 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-ink-900/70">
            Projected month-end
          </p>
          <p className="mt-2 font-serif text-3xl">
            {formatINR(current.projectedTotalRevenue)}
          </p>
          <p className="mt-3 text-xs text-ink-900/70">
            Run-rate on day {current.daysElapsed} of {current.daysInMonth}
          </p>
        </div>

        <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-ink-500">
            {months}-month revenue
          </p>
          <p className="mt-2 font-serif text-3xl text-ink-900">
            {formatINR(totals.totalRevenue)}
          </p>
          <p className="mt-3 text-xs text-ink-500">
            {formatINR(totals.serviceRevenue)} service ·{" "}
            {formatINR(totals.productRevenue)} shop
          </p>
        </div>

        <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-ink-500">
            Avg / month
          </p>
          <p className="mt-2 font-serif text-3xl text-ink-900">
            {formatINR(periodAvg)}
          </p>
          <p className="mt-3 text-xs text-ink-500">
            {totals.appointmentsDone} services · {totals.newCustomers} new
            customers
          </p>
        </div>
      </section>

      {/* ── Revenue trend chart ────────────────────────────────────── */}
      <section className="rounded-2xl bg-cream-50 p-6 shadow-soft sm:p-8">
        <h2 className="font-serif text-xl text-ink-900">Monthly revenue</h2>
        <p className="mt-1 text-xs text-ink-500">
          Service and shop revenue stacked per month. Hover a bar for the split.
        </p>
        <div className="mt-6">
          <RevenueTrendChart
            months={data.months}
            projected={current.projectedTotalRevenue}
          />
        </div>
      </section>

      {/* ── Leaderboards ───────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
          <h2 className="font-serif text-xl text-ink-900">Top services</h2>
          {data.topServices.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">No closed services yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.topServices.map((s) => (
                <li key={`${s.serviceId}-${s.serviceName}`}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-ink-900">
                      {s.serviceName}
                    </span>
                    <span className="shrink-0 font-medium text-ink-900">
                      {formatINR(s.revenue)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900/10">
                    <div
                      className="h-full rounded-full bg-ink-900"
                      style={{ width: `${(s.revenue / maxServiceRev) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    {s.done} {s.done === 1 ? "booking" : "bookings"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
          <h2 className="font-serif text-xl text-ink-900">Top specialists</h2>
          {data.topStaff.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">No closed services yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.topStaff.map((s) => (
                <li key={`${s.staffId}-${s.staffName}`}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-ink-900">{s.staffName}</span>
                    <span className="shrink-0 font-medium text-ink-900">
                      {formatINR(s.revenue)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900/10">
                    <div
                      className="h-full rounded-full bg-gold-500"
                      style={{ width: `${(s.revenue / maxStaffRev) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    {s.done} {s.done === 1 ? "service" : "services"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Payment mix ────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-cream-50 p-6 shadow-soft">
        <h2 className="font-serif text-xl text-ink-900">Payment mix</h2>
        {data.paymentMix.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No payments recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.paymentMix.map((p) => {
              const pct = Math.round((p.revenue / paymentTotal) * 100);
              return (
                <div key={p.method}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-ink-900">{p.method}</span>
                    <span className="text-ink-500">
                      {formatINR(p.revenue)} · {pct}% · {p.count}{" "}
                      {p.count === 1 ? "bill" : "bills"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900/10">
                    <div
                      className="h-full rounded-full bg-ink-900/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-cream-50 shadow-soft"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-cream-50 shadow-soft" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-cream-50 shadow-soft" />
        <div className="h-64 animate-pulse rounded-2xl bg-cream-50 shadow-soft" />
      </div>
    </div>
  );
}
