import Link from "next/link";
import { staffRegisterAction } from "../auth";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleMultiSelect } from "@/components/reception/RoleMultiSelect";
import { SALON_ROLES } from "@/lib/salon";

export const metadata = {
  title: "Staff Registration — Mr. & Mrs. Cuts Salon",
};

export default function StaffRegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-soft">
        <p className="font-serif text-xl text-ink-900">
          Mr. &amp; Mrs. Cuts{" "}
          <span className="italic text-gold-600">Salon</span>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign yourself up to use the reception desk. Each username and phone
          number can only be used once.
        </p>

        <form action={staffRegisterAction} className="mt-8 space-y-5">
          <Field
            id="fullName"
            name="fullName"
            label="Full name"
            type="text"
            autoComplete="name"
            autoFocus
          />
          <RoleMultiSelect
            name="roles"
            label="Roles (select one or more)"
            options={SALON_ROLES}
          />
          <Field
            id="phone"
            name="phone"
            label="Phone (10 digits)"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            pattern="\d{10}"
            title="Enter a 10-digit phone number (digits only)."
            placeholder="9876543210"
            maxLength={10}
          />
          <Field
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            id="username"
            name="username"
            label="Username (3–32 chars, lowercase)"
            type="text"
            autoComplete="username"
          />
          <Field
            id="password"
            name="password"
            label="Password (min 8 chars)"
            type="password"
            autoComplete="new-password"
          />
          <Field
            id="confirm"
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <SubmitButton pendingText="Creating account…">Create account</SubmitButton>

          <p className="text-center text-xs text-ink-500">
            Already registered?{" "}
            <Link
              href="/reception/login"
              className="font-semibold text-ink-900 underline underline-offset-4 hover:text-gold-600"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoFocus,
  autoComplete,
  required = true,
  inputMode,
  pattern,
  title,
  placeholder,
  maxLength,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoFocus?: boolean;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search" | "url" | "none";
  pattern?: string;
  title?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-widest text-ink-600"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        title={title}
        placeholder={placeholder}
        maxLength={maxLength}
        className="input-field mt-2"
      />
    </div>
  );
}
