import { redirect } from "next/navigation";
import { getDisplayName, getRole, getStaffId } from "@/app/reception/roles";
import { changePasswordAction, logoutAction } from "@/app/reception/auth";
import { api } from "@/lib/api";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set your password — Mr. & Mrs. Cuts Salon",
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const role = await getRole();
  const staffId = await getStaffId();

  // Only signed-in users with a pending forced change belong here. Verify
  // against the backend so the page can't be used by accounts that have
  // already chosen their password.
  if (!role || !staffId) {
    redirect("/reception");
  }

  let mustChange = false;
  try {
    const status = await api.getStaffSessionStatus(staffId);
    mustChange = status.mustChangePassword;
  } catch {
    // Fail open: still show the form rather than bouncing on a backend hiccup.
    mustChange = true;
  }
  if (!mustChange) {
    redirect("/reception");
  }

  const error = searchParams.error;
  const name = await getDisplayName();

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-soft">
        <p className="font-serif text-xl text-ink-900">
          Mr. &amp; Mrs. Cuts{" "}
          <span className="italic text-gold-600">Salon</span>
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Set your password
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          {name ? `Welcome, ${name}. ` : ""}
          Your account was created with a temporary password. Choose a new one
          before you continue.
        </p>

        <form action={changePasswordAction} className="mt-8 space-y-5">
          <Field
            id="currentPassword"
            name="currentPassword"
            label="Temporary password"
            autoComplete="current-password"
            autoFocus
          />
          <Field
            id="newPassword"
            name="newPassword"
            label="New password (min 8 chars)"
            autoComplete="new-password"
          />
          <Field
            id="confirm"
            name="confirm"
            label="Confirm new password"
            autoComplete="new-password"
          />

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <SubmitButton pendingText="Saving…">Save and continue</SubmitButton>
        </form>

        <form action={logoutAction} className="mt-6 text-center">
          <button
            type="submit"
            className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  id,
  name,
  label,
  autoComplete,
  autoFocus,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
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
        type="password"
        required
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-600"
      />
    </label>
  );
}
