import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { CustomerNotesEditor } from "@/components/reception/CustomerNotesEditor";
import { CustomerDetailsEditor } from "@/components/reception/CustomerDetailsEditor";
import { MergeCustomerTool } from "@/components/reception/MergeCustomerTool";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default async function CustomerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  let data;
  try {
    data = await api.getCustomerHistory(id);
  } catch {
    notFound();
  }

  const { customer, stats, appointments } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/reception/customers"
          className="text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          ← All customers
        </Link>
        <Link href="/reception/new" className="btn-primary !py-2 !px-4 text-[11px]">
          + New booking
        </Link>
      </div>

      <header className="rounded-2xl bg-cream-50 p-6 shadow-soft">
        <h1 className="font-serif text-3xl text-ink-900">{customer.fullName}</h1>
        <p className="mt-1 text-sm text-ink-600">
          <a href={`tel:${customer.phoneNumber}`} className="hover:text-gold-600">
            {customer.phoneNumber}
          </a>
          {customer.email ? ` · ${customer.email}` : ""}
        </p>
        <p className="mt-1 text-xs uppercase tracking-widest text-ink-500">
          Guest since {fmtDate(customer.createdAt)}
        </p>

        <div className="mt-5">
          <CustomerDetailsEditor
            customerId={customer.id}
            fullName={customer.fullName}
            phoneNumber={customer.phoneNumber}
            email={customer.email}
          />
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-900/10 pt-5">
          <div>
            <dt className="eyebrow">Visits</dt>
            <dd className="mt-1 font-serif text-2xl text-ink-900">
              {stats.visitCount}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Lifetime ₹</dt>
            <dd className="mt-1 font-serif text-2xl text-ink-900">
              ₹{stats.lifetimeValue.toLocaleString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Last visit</dt>
            <dd className="mt-1 font-serif text-2xl text-ink-900">
              {stats.lastVisitDate ? fmtDate(stats.lastVisitDate) : "—"}
            </dd>
          </div>
        </dl>
      </header>

      <CustomerNotesEditor customerId={customer.id} initial={customer.notes ?? ""} />

      <MergeCustomerTool targetId={customer.id} targetName={customer.fullName} />

      <section>
        <h2 className="font-serif text-xl text-ink-900">Visit history</h2>
        <div className="mt-4 overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Specialist</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                    No visits yet.
                  </td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-ink-900/5 last:border-b-0">
                  <td className="px-5 py-3 text-ink-700">
                    {fmtDate(a.appointmentDate)}
                    <span className="ml-2 text-xs text-ink-500">
                      {fmtTime(a.appointmentTime)}
                    </span>
                  </td>
                  <td className="px-5 py-3">{a.service?.serviceName ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-600">
                    {a.staff?.fullName ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{a.status}</td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {a.amountPaid != null
                      ? `₹${a.amountPaid.toLocaleString("en-IN")}`
                      : "—"}
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
