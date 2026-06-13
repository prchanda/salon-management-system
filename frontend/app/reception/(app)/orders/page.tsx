import Link from "next/link";
import { api } from "@/lib/api";
import { OrderStatusControl } from "@/components/reception/OrderStatusControl";
import { NavSubmitButton } from "@/components/NavSubmitButton";
import type { ProductOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number]["value"];

interface SearchParams {
  q?: string;
  status?: string;
  range?: string;
}

async function safeList(): Promise<ProductOrder[]> {
  try {
    return await api.getProductOrders();
  } catch {
    return [];
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatMoney(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function rangeStart(range: RangeOption): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

export default async function ReceptionOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const rawStatus = (searchParams.status ?? "All").trim();
  const status: StatusOption = (STATUS_OPTIONS as readonly string[]).includes(
    rawStatus
  )
    ? (rawStatus as StatusOption)
    : "All";
  const rawRange = (searchParams.range ?? "all").trim();
  const range: RangeOption = (
    RANGE_OPTIONS.map((r) => r.value) as readonly string[]
  ).includes(rawRange)
    ? (rawRange as RangeOption)
    : "all";

  const all = await safeList();

  const since = rangeStart(range);

  const orders = all.filter((o) => {
    if (status !== "All" && o.status !== status) return false;

    if (since) {
      const placed = new Date(o.createdAt);
      if (Number.isNaN(placed.getTime()) || placed < since) return false;
    }

    if (q) {
      const haystack = [
        o.customerName,
        o.customerPhone,
        o.customerEmail ?? "",
        o.productName,
        `#${o.id}`,
        String(o.id),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const totals = orders.reduce(
    (acc, o) => {
      acc.count += 1;
      if (o.status === "Pending") acc.pending += 1;
      if (o.status === "Completed") {
        // Use the amount actually collected (honours discounts); fall back to
        // the listed total for older orders captured before payment tracking.
        acc.revenue += Number(o.amountPaid ?? o.totalAmount) || 0;
      } else if (o.status === "Confirmed") {
        acc.revenue += Number(o.totalAmount) || 0;
      }
      return acc;
    },
    { count: 0, pending: 0, revenue: 0 }
  );

  const hasFilters = !!q || status !== "All" || range !== "all";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Orders</h1>
          <p className="mt-1 text-sm text-ink-500">
            Retail product orders placed from the public shop. Update the
            status as you confirm, fulfil, or cancel each one.
          </p>
        </div>
        <Link
          href="/reception/products"
          className="btn-ghost self-start whitespace-nowrap sm:self-auto"
        >
          Manage products →
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-full sm:flex-1 sm:min-w-[16rem]">
          <label
            htmlFor="orders-q"
            className="block text-[10px] font-semibold uppercase tracking-widest text-ink-500"
          >
            Search
          </label>
          <input
            id="orders-q"
            name="q"
            defaultValue={q}
            placeholder="Name, phone, email, product, #id…"
            className="input-field mt-1 w-full"
          />
        </div>
        <div>
          <label
            htmlFor="orders-status"
            className="block text-[10px] font-semibold uppercase tracking-widest text-ink-500"
          >
            Status
          </label>
          <select
            id="orders-status"
            name="status"
            defaultValue={status}
            className="input-field mt-1"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="orders-range"
            className="block text-[10px] font-semibold uppercase tracking-widest text-ink-500"
          >
            Placed
          </label>
          <select
            id="orders-range"
            name="range"
            defaultValue={range}
            className="input-field mt-1"
          >
            {RANGE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <NavSubmitButton pendingText="Filtering…">Apply</NavSubmitButton>
          {hasFilters && (
            <Link
              href="/reception/orders"
              className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label={hasFilters ? "Matching orders" : "Total orders"}
          value={`${totals.count}${hasFilters ? ` of ${all.length}` : ""}`}
        />
        <Stat label="Pending" value={String(totals.pending)} accent />
        <Stat
          label="Revenue (confirmed + done)"
          value={`₹${formatMoney(totals.revenue)}`}
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-500">
            {all.length === 0 ? (
              <>
                No orders yet. Once a customer places one from{" "}
                <Link
                  href="/shop"
                  target="_blank"
                  className="font-semibold text-gold-600 hover:text-ink-900"
                >
                  the shop
                </Link>
                , it will appear here.
              </>
            ) : (
              <>
                No orders match the current filters.{" "}
                <Link
                  href="/reception/orders"
                  className="font-semibold text-gold-600 hover:text-ink-900"
                >
                  Clear filters
                </Link>
                .
              </>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: stacked card list (< md) */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {orders.map((o) => (
                <li key={o.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-base text-ink-900 break-words">
                        {o.customerName}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-ink-400">
                        {formatDateTime(o.createdAt)} · #{o.id}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <OrderStatusControl order={o} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                    <a
                      href={`tel:${o.customerPhone.replace(/[^\d+]/g, "")}`}
                      className="hover:text-gold-600"
                    >
                      {o.customerPhone}
                    </a>
                    {o.customerEmail && (
                      <a
                        href={`mailto:${o.customerEmail}`}
                        className="break-all text-ink-500 hover:text-gold-600"
                      >
                        {o.customerEmail}
                      </a>
                    )}
                  </div>

                  {o.deliveryAddress && (
                    <p className="whitespace-pre-line rounded-md bg-cream-100 px-2 py-1.5 text-[11px] text-ink-600">
                      {o.deliveryAddress}
                    </p>
                  )}
                  {o.notes && (
                    <p className="whitespace-pre-line text-[11px] italic text-ink-500">
                      “{o.notes}”
                    </p>
                  )}

                  <div className="flex items-end justify-between gap-3 border-t border-ink-900/5 pt-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink-900 break-words">
                        {o.productName}
                      </p>
                      {o.productId ? (
                        <Link
                          href={`/reception/products/${o.productId}/edit`}
                          className="text-[10px] uppercase tracking-widest text-gold-600 hover:text-ink-900"
                        >
                          Edit listing →
                        </Link>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest text-ink-400">
                          Product removed
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {o.status === "Completed" && o.amountPaid != null ? (
                        <>
                          <p className="font-serif text-lg text-gold-600">
                            ₹{formatMoney(Number(o.amountPaid))}
                          </p>
                          {Number(o.amountPaid) !== Number(o.totalAmount) && (
                            <p className="text-[10px] uppercase tracking-widest text-ink-400 line-through">
                              ₹{formatMoney(Number(o.totalAmount))}
                            </p>
                          )}
                          {o.paymentMethod && (
                            <p className="text-[10px] uppercase tracking-widest text-ink-400">
                              {o.paymentMethod}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-serif text-lg text-gold-600">
                            ₹{formatMoney(Number(o.totalAmount))}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-ink-400">
                            × {o.quantity} @ ₹{formatMoney(Number(o.unitPrice))}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: full table (md+) */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-cream-100 text-[11px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Placed</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-t border-ink-900/5 align-top"
                    >
                      <td className="px-5 py-4 text-xs text-ink-500">
                        {formatDateTime(o.createdAt)}
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-400">
                          #{o.id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-serif text-base text-ink-900">
                          {o.customerName}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-600">
                          <a
                            href={`tel:${o.customerPhone.replace(/[^\d+]/g, "")}`}
                            className="hover:text-gold-600"
                          >
                            {o.customerPhone}
                          </a>
                        </div>
                        {o.customerEmail && (
                          <div className="text-xs text-ink-500">
                            <a
                              href={`mailto:${o.customerEmail}`}
                              className="hover:text-gold-600"
                            >
                              {o.customerEmail}
                            </a>
                          </div>
                        )}
                        {o.deliveryAddress && (
                          <div className="mt-2 max-w-xs whitespace-pre-line rounded-md bg-cream-100 px-2 py-1.5 text-[11px] text-ink-600">
                            {o.deliveryAddress}
                          </div>
                        )}
                        {o.notes && (
                          <div className="mt-2 max-w-xs whitespace-pre-line text-[11px] italic text-ink-500">
                            “{o.notes}”
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-ink-900">
                          {o.productName}
                        </div>
                        {o.productId ? (
                          <Link
                            href={`/reception/products/${o.productId}/edit`}
                            className="text-[11px] uppercase tracking-widest text-gold-600 hover:text-ink-900"
                          >
                            Edit listing →
                          </Link>
                        ) : (
                          <span className="text-[11px] uppercase tracking-widest text-ink-400">
                            Product removed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-ink-700">
                        × {o.quantity}
                      </td>
                      <td className="px-5 py-4 text-right font-serif text-gold-600">
                        {o.status === "Completed" && o.amountPaid != null ? (
                          <>
                            ₹{formatMoney(Number(o.amountPaid))}
                            {Number(o.amountPaid) !== Number(o.totalAmount) && (
                              <div className="text-[10px] uppercase tracking-widest text-ink-400 line-through">
                                ₹{formatMoney(Number(o.totalAmount))}
                              </div>
                            )}
                            {o.paymentMethod && (
                              <div className="text-[10px] uppercase tracking-widest text-ink-400">
                                {o.paymentMethod}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            ₹{formatMoney(Number(o.totalAmount))}
                            <div className="text-[10px] uppercase tracking-widest text-ink-400">
                              @ ₹{formatMoney(Number(o.unitPrice))}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <OrderStatusControl order={o} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-cream-50 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </p>
      <p
        className={`mt-2 font-serif text-2xl ${accent ? "text-gold-600" : "text-ink-900"}`}
      >
        {value}
      </p>
    </div>
  );
}
