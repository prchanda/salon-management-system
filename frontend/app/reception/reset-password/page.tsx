import Link from "next/link";
import { completePasswordResetAction } from "../auth";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string };
}) {
  const token = searchParams.token ?? "";
  const error = searchParams.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-soft">
        <p className="font-serif text-xl text-ink-900">
          Mr. &amp; Mrs. Cuts{" "}
          <span className="italic text-gold-600">Salon</span>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Set a new password for your account. The reset link is valid for 30
          minutes.
        </p>

        {!token ? (
          <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            This page must be opened from the reset link sent to your email.
          </p>
        ) : (
          <form action={completePasswordResetAction} className="mt-6 space-y-5">
            <input type="hidden" name="token" value={token} />
            <div>
              <label
                htmlFor="newPassword"
                className="text-[11px] font-semibold uppercase tracking-widest text-ink-600"
              >
                New password (min 8 chars)
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
                className="input-field mt-2"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="text-[11px] font-semibold uppercase tracking-widest text-ink-600"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input-field mt-2"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <SubmitButton pendingText="Updating…">Update password</SubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-500">
          <Link
            href="/reception/login"
            className="font-semibold text-ink-900 underline underline-offset-4 hover:text-gold-600"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
