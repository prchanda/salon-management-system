import Link from "next/link";
import { requestPasswordResetAction } from "../auth";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusParamCleaner } from "@/components/reception/StatusParamCleaner";

export const metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  const error = searchParams.error;
  const sent = searchParams.sent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <StatusParamCleaner params={["sent"]} />
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-soft">
        <p className="font-serif text-xl text-ink-900">
          Mr. &amp; Mrs. Cuts{" "}
          <span className="italic text-gold-600">Salon</span>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Enter the email address you registered with. We&rsquo;ll send you a
          link to set a new password.
        </p>

        {sent && (
          <p className="mt-5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            If an account exists for that email, a reset link has been sent.
            Please check your inbox (and spam folder).
          </p>
        )}

        <form action={requestPasswordResetAction} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-widest text-ink-600"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              autoFocus
              className="input-field mt-2"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <SubmitButton pendingText="Sending link…">Send reset link</SubmitButton>

          <p className="text-center text-xs text-ink-500">
            Remembered it?{" "}
            <Link
              href="/reception/login"
              className="font-semibold text-ink-900 underline underline-offset-4 hover:text-gold-600"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
