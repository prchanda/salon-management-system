import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import type { Customer } from "@/lib/types";
import { NavSubmitButton } from "@/components/NavSubmitButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Reception" };

async function safeGetCustomers(q: string): Promise<Customer[]> {
  try {
    return await api.getCustomers(q || undefined, LIMIT);
  } catch {
    return [];
  }
}

const LIMIT = 100;

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const q = (searchParams.q ?? "").trim();
  const customers = await safeGetCustomers(q);
  const atLimit = customers.length >= LIMIT;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Customers</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          {q
            ? `${customers.length} match${customers.length === 1 ? "" : "es"}`
            : atLimit
            ? `Latest ${LIMIT} customers`
            : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        </h1>
        {!q && atLimit && (
          <p className="mt-1 text-sm text-ink-500">
            Showing the most recent {LIMIT}. Search by phone or name to find
            anyone else.
          </p>
        )}
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by phone or name…"
          className="input-field w-full sm:w-80"
        />
        <NavSubmitButton pendingText="Searching…">Search</NavSubmitButton>
      </form>

      <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
        {customers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No customers match.
          </p>
        ) : (
          <>
            {/* Mobile: stacked card list (< md) */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {customers.map((c) => (
                <li key={c.id} className="space-y-1.5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/reception/customers/${c.id}`}
                      className="min-w-0 font-serif text-base font-semibold text-ink-900 break-words hover:text-gold-600"
                    >
                      {c.fullName}
                    </Link>
                    <span className="shrink-0 text-xs text-ink-500">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {c.phoneNumber && (
                    <p className="text-xs text-ink-600">
                      <a
                        href={`tel:${c.phoneNumber.replace(/[^\d+]/g, "")}`}
                        className="hover:text-gold-600"
                      >
                        {c.phoneNumber}
                      </a>
                    </p>
                  )}
                  {c.notes && (
                    <p className="text-xs text-ink-500 break-words">
                      {c.notes.slice(0, 80)}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop: full table (md+) */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Notes</th>
                    <th className="px-5 py-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-ink-900/5 last:border-b-0 hover:bg-cream-100"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/reception/customers/${c.id}`}
                          className="font-semibold text-ink-900 hover:text-gold-600"
                        >
                          {c.fullName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {c.phoneNumber}
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {c.notes ? c.notes.slice(0, 60) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-500">
                        {new Date(c.createdAt).toLocaleDateString("en-IN")}
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
