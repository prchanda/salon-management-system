import Link from "next/link";
import { api } from "@/lib/api";
import { SALON, waLink } from "@/lib/salon";
import { NavSubmitButton } from "@/components/NavSubmitButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Re-engage — Reception" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(d: string) {
  const diff =
    (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

function buildWa(name: string, phone: string | null | undefined) {
  return waLink(
    `Hi ${name.split(" ")[0]}, this is ${SALON.name}. It's been a while! We'd love to see you back at the salon. Reply here to book your next visit.`,
    phone ?? ""
  );
}

export default async function DormantPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = Number(searchParams.days ?? 60);

  let data;
  try {
    data = await api.getDormantCustomers(days);
  } catch {
    data = { daysThreshold: days, customers: [] };
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Re-engage</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Customers we haven&apos;t seen in {data.daysThreshold}+ days
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          {data.customers.length} on the list. One WhatsApp brings most of them
          back.
        </p>
      </div>

      <form className="flex items-center gap-3">
        <label className="text-[11px] uppercase tracking-widest text-ink-500">
          Threshold (days)
        </label>
        <input
          name="days"
          type="number"
          defaultValue={days}
          className="w-24 rounded-md border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm"
        />
        <NavSubmitButton pendingText="Loading…">Show customers</NavSubmitButton>
      </form>

      <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
        {data.customers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No dormant customers in this window. 🎉
          </p>
        ) : (
          <>
            {/* Mobile: stacked card list (< md) */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {data.customers.map((d) => (
                <li key={d.customer.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/reception/customers/${d.customer.id}`}
                        className="font-serif text-base font-semibold text-ink-900 break-words hover:text-gold-600"
                      >
                        {d.customer.fullName}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-600">
                        {d.customer.phoneNumber ? (
                          <a
                            href={`tel:${d.customer.phoneNumber.replace(/[^\d+]/g, "")}`}
                            className="hover:text-gold-600"
                          >
                            {d.customer.phoneNumber}
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <a
                      href={buildWa(d.customer.fullName, d.customer.phoneNumber)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline shrink-0 !py-1.5 !px-3 text-[10px]"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <p className="text-xs text-ink-500">
                    Last visit {fmtDate(d.lastVisit)}
                    <span className="ml-1 text-ink-400">
                      ({daysAgo(d.lastVisit)}d ago)
                    </span>
                  </p>
                </li>
              ))}
            </ul>

            {/* Desktop: full table (md+) */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Last visit</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((d) => (
                    <tr
                      key={d.customer.id}
                      className="border-b border-ink-900/5 last:border-b-0"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/reception/customers/${d.customer.id}`}
                          className="font-semibold text-ink-900 hover:text-gold-600"
                        >
                          {d.customer.fullName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {d.customer.phoneNumber}
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {fmtDate(d.lastVisit)}
                        <span className="ml-2 text-xs text-ink-500">
                          ({daysAgo(d.lastVisit)}d ago)
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={buildWa(
                            d.customer.fullName,
                            d.customer.phoneNumber
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline !py-1.5 !px-3 text-[10px]"
                        >
                          WhatsApp
                        </a>
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
