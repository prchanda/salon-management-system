import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import type { Customer } from "@/lib/types";
import { NavSubmitButton } from "@/components/NavSubmitButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Reception" };

async function safeGetCustomers(): Promise<Customer[]> {
  try {
    return await api.getCustomers();
  } catch {
    return [];
  }
}

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const all = await safeGetCustomers();

  const filtered = q
    ? all.filter(
        (c) =>
          (c.phoneNumber?.toLowerCase().includes(q) ?? false) ||
          (c.fullName?.toLowerCase().includes(q) ?? false)
      )
    : all;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Customers</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          {all.length} customer{all.length === 1 ? "" : "s"}
        </h1>
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
        <table className="w-full text-sm">
          <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Notes</th>
              <th className="px-5 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink-500">
                  No customers match.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
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
                <td className="px-5 py-3 text-ink-600">{c.phoneNumber}</td>
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
    </div>
  );
}
