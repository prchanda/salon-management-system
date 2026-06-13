import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Services — Reception" };

async function safeList(): Promise<Service[]> {
  try {
    return await api.getAdminServices();
  } catch {
    return [];
  }
}

function formatPrice(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export default async function ReceptionServicesPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const services = await safeList();
  const created = searchParams.created === "1";
  const updated = searchParams.updated === "1";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Services</h1>
          <p className="mt-1 text-sm text-ink-500">
            The treatment menu customers see on the website. Add new services
            here — they appear on the public services page right away.
          </p>
        </div>
        <Link
          href="/reception/services/new"
          className="btn-primary self-start whitespace-nowrap sm:self-auto"
        >
          New service
        </Link>
      </div>

      {created && (
        <p className="mt-6 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Service created. It&apos;s now live on the website.
        </p>
      )}

      {updated && (
        <p className="mt-6 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Service updated. Changes are now live on the website.
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
        {services.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">
            No services yet. Add your first one to populate the website menu.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-[10px] uppercase tracking-widest text-ink-500">
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Duration</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-ink-900/5 last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-900">{s.serviceName}</p>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">
                        {s.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {s.category ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {s.durationMinutes} min
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    ₹{formatPrice(s.price)}
                  </td>
                  <td className="px-5 py-4">
                    {s.isActive ? (
                      <span className="text-xs font-semibold uppercase tracking-widest text-green-700">
                        Live
                      </span>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/reception/services/${s.id}/edit`}
                      className="text-xs font-semibold uppercase tracking-widest text-gold-700 hover:text-gold-600"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
