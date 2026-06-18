import Link from "next/link";
import { loginAction } from "../auth";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Reception Login" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string; reset?: string };
}) {
  const next = searchParams.next ?? "/reception";
  const error = searchParams.error;
  const justReset = searchParams.reset === "1";

  const errorMessage =
    error === "credentials"
      ? "Username/phone or password is incorrect."
      : error === "pending"
      ? "Your account is awaiting owner approval. You'll be emailed once it's enabled."
      : error === "server"
      ? "Could not reach the server. Please try again."
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-soft">
        <p className="font-serif text-xl text-ink-900">
          Mr. &amp; Mrs. Cuts{" "}
          <span className="italic text-gold-600">Salon</span>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">Reception</h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign in with your account.
        </p>

        {justReset && (
          <p className="mt-5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Password reset. Please sign in with the new password.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-5">
          <input type="hidden" name="next" value={next} />
          <Field
            id="username"
            name="username"
            label="Username or phone"
            type="text"
            autoComplete="username"
            autoFocus
          />
          <Field
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          {errorMessage && (
            <p className="text-xs text-red-600">{errorMessage}</p>
          )}
          <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
          <p className="text-center text-xs text-ink-500">
            <Link
              href="/reception/forgot-password"
              className="font-semibold text-ink-900 underline underline-offset-4 hover:text-gold-600"
            >
              Forgot password?
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
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoFocus?: boolean;
  autoComplete?: string;
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
        required
        className="input-field mt-2"
      />
    </div>
  );
}
