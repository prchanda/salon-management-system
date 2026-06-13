import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import { SubmitButton } from "@/components/SubmitButton";
import { SERVICE_CATEGORIES, DEFAULT_SERVICE_CATEGORY } from "@/lib/serviceCategories";
import type { Service } from "@/lib/types";
import { updateServiceAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit service — Reception" };

async function findService(id: number): Promise<Service | null> {
  try {
    const services = await api.getAdminServices();
    return services.find((s) => s.id === id) ?? null;
  } catch {
    return null;
  }
}

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { formError?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const service = await findService(id);
  if (!service) {
    notFound();
  }

  const formError = searchParams.formError ?? null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-ink-900">Edit service</h1>
      <p className="mt-1 text-sm text-ink-500">
        Update the price, duration and visibility for{" "}
        <span className="font-medium text-ink-700">{service.serviceName}</span>.
      </p>

      <form
        action={updateServiceAction}
        className="mt-8 space-y-6 rounded-2xl bg-cream-50 p-6 shadow-soft"
      >
        <input type="hidden" name="id" value={service.id} />

        {formError && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError}
          </p>
        )}

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Category
          </span>
          <select
            id="category"
            name="category"
            defaultValue={
              SERVICE_CATEGORIES.find(
                (c) =>
                  c.value.toLowerCase() ===
                  (service.category ?? "").toLowerCase()
              )?.value ?? DEFAULT_SERVICE_CATEGORY
            }
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] leading-snug text-ink-400">
            Controls which section this service appears under on the public menu.
          </span>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Duration (minutes)
            </span>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={1440}
              step={1}
              defaultValue={service.durationMinutes}
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Price (₹)
            </span>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              required
              min={0}
              step="0.01"
              defaultValue={service.price}
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-900/10 bg-cream-100/50 p-4">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={service.isActive}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-900/20 text-gold-600 focus:ring-gold-600"
          />
          <span className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-700">
              Visible on the website
            </span>
            <span className="mt-1 text-[11px] leading-snug text-ink-400">
              Untick to hide this service from customers without deleting it.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Saving…" className="btn-primary">
            Save changes
          </SubmitButton>
          <Link href="/reception/services" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
