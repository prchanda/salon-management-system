import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/app/reception/roles";
import { SubmitButton } from "@/components/SubmitButton";
import { SERVICE_CATEGORIES } from "@/lib/serviceCategories";
import { createServiceAction } from "../actions";

export const metadata = { title: "New service — Reception" };

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: { formError?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const formError = searchParams.formError ?? null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-ink-900">New service</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add a treatment to the menu. Once created it shows up on the public
        services page for customers to browse.
      </p>

      <form
        action={createServiceAction}
        className="mt-8 space-y-6 rounded-2xl bg-cream-50 p-6 shadow-soft"
      >
        {formError && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError}
          </p>
        )}

        <Field
          id="serviceName"
          name="serviceName"
          label="Service name"
          type="text"
          placeholder="Signature Haircut & Style"
          maxLength={160}
          autoFocus
        />

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Category
          </span>
          <select
            id="category"
            name="category"
            defaultValue="Hair"
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] leading-snug text-ink-400">
            Controls which section the service appears under on the public menu.
          </span>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="durationMinutes"
            name="durationMinutes"
            label="Duration (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            step={1}
            placeholder="45"
          />
          <Field
            id="price"
            name="price"
            label="Price (₹)"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="800"
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Description (optional)
          </span>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            placeholder="What the treatment includes, who it's for, etc."
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-ink-700 focus:border-gold-600 focus:outline-none"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-900/10 bg-cream-100/50 p-4">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-900/20 text-gold-600 focus:ring-gold-600"
          />
          <span className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-700">
              Visible on the website
            </span>
            <span className="mt-1 text-[11px] leading-snug text-ink-400">
              Untick to save it without showing it to customers yet.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Creating…" className="btn-primary">
            Create service
          </SubmitButton>
          <Link href="/reception/services" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  placeholder,
  maxLength,
  min,
  max,
  step,
  inputMode,
  autoFocus,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number | string;
  inputMode?: "numeric" | "decimal" | "text";
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
      />
    </label>
  );
}
