import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import { StatusParamCleaner } from "@/components/reception/StatusParamCleaner";
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
      <StatusParamCleaner params={["created", "updated"]} />
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
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {services.map((s) => (
                <li key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/reception/services/${s.id}/edit`}
                      className="min-w-0 font-serif text-base text-ink-900 hover:text-gold-600"
                    >
                      <span className="break-words">{s.serviceName}</span>
                    </Link>
                    <span className="shrink-0 font-serif text-sm text-gold-600">
                      ₹{formatPrice(s.price)}
                    </span>
                  </div>
                  {s.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                    <span>{s.category ?? "—"}</span>
                    <span className="text-ink-400">{s.durationMinutes} min</span>
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest text-ink-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/reception/services/${s.id}/edit`}
                      className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
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
                        <p className="font-medium text-ink-900">
                          {s.serviceName}
                        </p>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
