import { redirect } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import {
  approveStaffAction,
  createStaffAction,
  reactivateStaffAction,
  rejectStaffAction,
  updateStaffAction,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleMultiSelect } from "@/components/reception/RoleMultiSelect";
import { PasswordField } from "@/components/reception/PasswordField";
import { StaffRow } from "@/components/reception/StaffRow";
import { FocusHighlighter } from "@/components/reception/FocusHighlighter";
import { SALON_ROLES } from "@/lib/salon";
import type { StaffAccount } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff accounts — Reception" };

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default async function StaffAccountsPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    formError?: string;
    created?: string;
    updated?: string;
    editId?: string;
    editError?: string;
    reactivateMsg?: string;
    reactivated?: string;
  };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  let accounts: StaffAccount[] = [];
  let fetchError = false;
  try {
    accounts = await api.getStaffAccounts();
  } catch {
    fetchError = true;
  }

  const pending = accounts.filter((a) => !a.isApproved);
  const approved = accounts.filter((a) => a.isApproved && a.isActive);
  const deactivated = accounts.filter((a) => a.isApproved && !a.isActive);

  const actionError =
    searchParams.error === "approve"
      ? "Could not approve that account. Please try again."
      : searchParams.error === "reject"
      ? "Could not revoke that account. Please try again."
      : searchParams.error === "update"
      ? "Could not update that account. Please try again."
      : searchParams.error === "reactivate"
      ? searchParams.reactivateMsg ||
        "Could not reactivate that account. Please try again."
      : null;

  const formError = searchParams.formError ?? null;
  const created = searchParams.created === "1";
  const updatedId = searchParams.updated ? Number(searchParams.updated) : null;
  const updated = updatedId !== null && Number.isFinite(updatedId);
  const editId = searchParams.editId ? Number(searchParams.editId) : null;
  const editError = searchParams.editError ?? null;
  const reactivated = searchParams.reactivated === "1";

  return (
    <div className="space-y-10">
      <Suspense fallback={null}>
        <FocusHighlighter />
      </Suspense>
      <div>
        <p className="eyebrow">Access control</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-900">
          Staff accounts
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Approve new sign-ups before they can use the reception desk. Revoke
          access anytime.
        </p>
      </div>

      {fetchError && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          Could not load staff accounts. Is the backend running?
        </p>
      )}
      {actionError && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {created && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Account created. The staff member can sign in right away.
        </p>
      )}
      {updated && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Staff details updated.
        </p>
      )}
      {reactivated && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          Account reactivated. The staff member can sign in again.
        </p>
      )}

      <ManualAddStaff error={formError} created={created} />

      <Section
        title={`Pending approval (${pending.length})`}
        empty="No one waiting for approval."
        accounts={pending}
        kind="pending"
        editId={editId}
        editError={editError}
        justUpdatedId={updated ? updatedId : null}
      />

      <Section
        title={`Active accounts (${approved.length})`}
        empty="No active staff accounts yet."
        accounts={approved}
        kind="approved"
        editId={editId}
        editError={editError}
        justUpdatedId={updated ? updatedId : null}
      />

      {deactivated.length > 0 && (
        <Section
          title={`Deactivated accounts (${deactivated.length})`}
          empty="No deactivated accounts."
          accounts={deactivated}
          kind="deactivated"
          editId={editId}
          editError={editError}
          justUpdatedId={updated ? updatedId : null}
        />
      )}
    </div>
  );
}

function ManualAddStaff({
  error,
  created,
}: {
  error: string | null;
  created: boolean;
}) {
  return (
    <section>
      {/* `<details>` is uncontrolled: the user toggles `open` directly on the
          DOM node. Since `open={error !== null}` is `false` both before and
          after a successful create, React sees no prop change and leaves the
          user-opened panel open. Keying on `created` forces a fresh remount so
          the panel collapses once the account is created. */}
      <details
        key={created ? "created" : "idle"}
        open={error !== null}
        className="group rounded-2xl bg-cream-50 shadow-soft"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-serif text-xl text-ink-900">Add staff manually</h2>
            <p className="mt-1 text-xs text-ink-500">
              For staff without an email address who cannot register themselves.
              The account is approved instantly, and they&apos;ll be asked to set
              their own password on first sign-in.
            </p>
          </div>
          <span className="ml-4 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-ink-500 group-open:hidden">
            Add
          </span>
          <span className="ml-4 hidden shrink-0 text-[11px] font-semibold uppercase tracking-widest text-ink-500 group-open:inline">
            Close
          </span>
        </summary>

        <form
          action={createStaffAction}
          className="border-t border-ink-900/10 px-5 py-5"
        >
          {error && (
            <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <AddField
              id="fullName"
              name="fullName"
              label="Full name"
              type="text"
              autoComplete="name"
            />
            <div className="sm:col-span-2">
              <RoleMultiSelect
                name="roles"
                label="Roles (select one or more)"
                options={SALON_ROLES}
              />
            </div>
            <AddField
              id="phone"
              name="phone"
              label="Phone (optional, 10 digits)"
              type="tel"
              required={false}
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              placeholder="leave blank if none"
            />
            <AddField
              id="email"
              name="email"
              label="Email (optional)"
              type="email"
              required={false}
              autoComplete="email"
              placeholder="leave blank if none"
            />
            <AddField
              id="username"
              name="username"
              label="Username (3–32, lowercase)"
              type="text"
              autoComplete="new-password"
            />
            <PasswordField
              id="password"
              name="password"
              label="Temporary password (min 8)"
              minLength={8}
            />
          </div>
          <div className="mt-5">
            <SubmitButton pendingText="Creating account…">
              Create account
            </SubmitButton>
          </div>
        </form>
      </details>
    </section>
  );
}

function AddField({
  id,
  name,
  label,
  type,
  required = true,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  pattern?: string;
  maxLength?: number;
  placeholder?: string;
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
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-600"
      />
    </label>
  );
}

function Section({
  title,
  empty,
  accounts,
  kind,
  editId,
  editError,
  justUpdatedId,
}: {
  title: string;
  empty: string;
  accounts: StaffAccount[];
  kind: "pending" | "approved" | "deactivated";
  editId: number | null;
  editError: string | null;
  justUpdatedId: number | null;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink-900">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
        {accounts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">{empty}</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {accounts.map((a) => (
                <StaffRow
                  key={a.id}
                  variant="card"
                  account={a}
                  kind={kind}
                  dateLabel={fmtDate(
                    kind === "pending" ? a.registeredAt : a.approvedAt
                  )}
                  initialEditOpen={editId === a.id}
                  editError={editId === a.id ? editError : null}
                  justUpdated={justUpdatedId === a.id}
                  approveAction={approveStaffAction}
                  rejectAction={rejectStaffAction}
                  updateAction={updateStaffAction}
                  reactivateAction={reactivateStaffAction}
                />
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-ink-900/10 bg-cream-100 text-left text-[10px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">
                      {kind === "pending" ? "Requested" : "Approved"}
                    </th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <StaffRow
                      key={a.id}
                      variant="row"
                      account={a}
                      kind={kind}
                      dateLabel={fmtDate(
                        kind === "pending" ? a.registeredAt : a.approvedAt
                      )}
                      initialEditOpen={editId === a.id}
                      editError={editId === a.id ? editError : null}
                      justUpdated={justUpdatedId === a.id}
                      approveAction={approveStaffAction}
                      rejectAction={rejectStaffAction}
                      updateAction={updateStaffAction}
                      reactivateAction={reactivateStaffAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
