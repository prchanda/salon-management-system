import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DaySummary } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Day summary — Reception" };

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftIso(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function formatINR(value: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

async function safeGetSummary(date: string): Promise<DaySummary | null> {
  try {
    return await api.getDaySummary(date);
  } catch {
    return null;
  }
}

export default function SummaryPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const date = searchParams.date ?? todayIso();
  const today = todayIso();
  const prev = shiftIso(date, -1);
  const next = shiftIso(date, 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Day summary</p>
          <h1 className="mt-2 font-serif text-3xl text-ink-900">
            {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/reception/summary?date=${prev}`}
            className="btn-outline !py-2 !px-3 text-[11px]"
          >
            ← Prev
          </Link>
          {date !== today && (
            <Link
              href="/reception/summary"
              className="btn-outline !py-2 !px-3 text-[11px]"
            >
              Today
            </Link>
          )}
          <Link
            href={`/reception/summary?date=${next}`}
            className="btn-outline !py-2 !px-3 text-[11px]"
          >
            Next →
          </Link>
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded-md border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="btn-outline !py-2 !px-4 text-[11px]"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      <Suspense key={date} fallback={<SummarySkeleton />}>
        <SummaryContent date={date} />
      </Suspense>
    </div>
  );
}

async function SummaryContent({ date }: { date: string }) {
  const data = await safeGetSummary(date);

  if (!data) {
    return (
      <div className="rounded-2xl bg-cream-50 p-10 text-center text-sm text-ink-500">
        Unable to load the summary right now.
      </div>
    );
  }

  const t = data.totals;
  // Defensive fallbacks so a stale backend (missing the new shop fields) won't crash the page.
  const byProduct = data.byProduct ?? [];
  const productOrdersPlaced = t.productOrdersPlaced ?? 0;
  const productOrdersCompleted = t.productOrdersCompleted ?? 0;
  const productOrdersPending = t.productOrdersPending ?? 0;
  const productRevenue = t.productRevenue ?? 0;
  const productUnitsSold = t.productUnitsSold ?? 0;
  const totalRevenue = t.totalRevenue ?? t.revenue + productRevenue;

  const stats = [
    { label: "Appointments", value: t.appointments },
    { label: "Done", value: t.done },
    { label: "Booked (open)", value: t.booked },
    { label: "No-show", value: t.noShow },
    { label: "Cancelled", value: t.cancelled },
    { label: "New customers", value: t.newCustomers },
    { label: "Orders placed", value: productOrdersPlaced },
    { label: "Units sold", value: productUnitsSold },
    { label: "Orders open", value: productOrdersPending },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-ink-900 p-8 text-cream-50 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-cream-100/70">
            Service revenue
          </p>
          <p className="mt-2 font-serif text-4xl">{formatINR(t.revenue)}</p>
          <p className="mt-3 text-xs text-cream-100/70">
            {t.done} {t.done === 1 ? "bill" : "bills"} closed · avg{" "}
            {formatINR(t.avgTicket)}
          </p>
        </div>
        <div className="rounded-2xl bg-gold-600 p-8 text-ink-900 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-ink-900/70">
            Shop revenue
          </p>
          <p className="mt-2 font-serif text-4xl">
            {formatINR(productRevenue)}
          </p>
          <p className="mt-3 text-xs text-ink-900/70">
            {productOrdersCompleted}{" "}
            {productOrdersCompleted === 1 ? "order" : "orders"} completed ·{" "}
            {productUnitsSold} {productUnitsSold === 1 ? "unit" : "units"}
          </p>
        </div>
        <div className="rounded-2xl bg-cream-50 p-8 shadow-soft">
          <p className="text-[11px] uppercase tracking-widest text-ink-500">
            Combined revenue
          </p>
          <p className="mt-2 font-serif text-4xl text-ink-900">
            {formatINR(totalRevenue)}
          </p>
          <p className="mt-3 text-xs text-ink-500">services + shop</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-cream-50 p-5 shadow-soft">
            <p className="text-[10px] uppercase tracking-widest text-ink-500">
              {s.label}
            </p>
            <p className="mt-2 font-serif text-3xl text-ink-900">{s.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-serif text-xl text-ink-900">By specialist</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-cream-50 shadow-soft">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
              <tr>
                <th className="px-5 py-3">Specialist</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Done</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.byStaff.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-500">
                    Nothing booked yet.
                  </td>
                </tr>
              )}
              {data.byStaff.map((row) => (
                <tr
                  key={`${row.staffId ?? "x"}-${row.staffName}`}
                  className="border-b border-ink-900/5 last:border-b-0"
                >
                  <td className="px-5 py-3 text-ink-900">{row.staffName}</td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {row.total}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {row.done}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatINR(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl text-ink-900">By service</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-cream-50 shadow-soft">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
                <tr>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Done</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byService.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-ink-500"
                    >
                      No services yet.
                    </td>
                  </tr>
                )}
                {data.byService.map((row) => (
                  <tr
                    key={`${row.serviceId ?? "x"}-${row.serviceName}`}
                    className="border-b border-ink-900/5 last:border-b-0"
                  >
                    <td className="px-5 py-3 text-ink-900">{row.serviceName}</td>
                    <td className="px-5 py-3 text-right text-ink-700">
                      {row.total}
                    </td>
                    <td className="px-5 py-3 text-right text-ink-700">
                      {row.done}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">
                      {formatINR(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl text-ink-900">Payments</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-cream-50 shadow-soft">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
                <tr>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3 text-right">Bills</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.byPaymentMethod.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-ink-500"
                    >
                      Nothing collected yet.
                    </td>
                  </tr>
                )}
                {data.byPaymentMethod.map((row) => {
                  const share =
                    t.revenue > 0
                      ? Math.round((row.revenue / t.revenue) * 100)
                      : 0;
                  return (
                    <tr
                      key={row.method}
                      className="border-b border-ink-900/5 last:border-b-0"
                    >
                      <td className="px-5 py-3 text-ink-900">{row.method}</td>
                      <td className="px-5 py-3 text-right text-ink-700">
                        {row.count}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-900">
                        {formatINR(row.revenue)}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-500">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl text-ink-900">Shop sales</h2>
          <p className="text-[11px] uppercase tracking-widest text-ink-400">
            Completed orders only
          </p>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-cream-50 shadow-soft">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byProduct.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-ink-500"
                  >
                    {productOrdersPlaced === 0
                      ? "No orders placed today."
                      : `${productOrdersPlaced} order${
                          productOrdersPlaced === 1 ? "" : "s"
                        } placed today, none completed yet.`}
                  </td>
                </tr>
              )}
              {byProduct.map((row) => (
                <tr
                  key={`${row.productId ?? "x"}-${row.productName}`}
                  className="border-b border-ink-900/5 last:border-b-0"
                >
                  <td className="px-5 py-3 text-ink-900">{row.productName}</td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {row.orders}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {row.units}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatINR(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 rounded-2xl bg-ink-900/80" />
        <div className="h-40 rounded-2xl bg-gold-600/60" />
        <div className="h-40 rounded-2xl bg-cream-50 shadow-soft" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-cream-50 p-5 shadow-soft">
            <div className="h-3 w-20 rounded bg-ink-900/10" />
            <div className="mt-4 h-8 w-16 rounded bg-ink-900/10" />
          </div>
        ))}
      </section>

      <section>
        <div className="h-5 w-32 rounded bg-ink-900/10" />
        <div className="mt-4 space-y-2 rounded-2xl bg-cream-50 p-5 shadow-soft">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-full rounded bg-ink-900/5" />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, c) => (
          <div key={c}>
            <div className="h-5 w-32 rounded bg-ink-900/10" />
            <div className="mt-4 space-y-2 rounded-2xl bg-cream-50 p-5 shadow-soft">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full rounded bg-ink-900/5" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
