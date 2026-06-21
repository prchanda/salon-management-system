"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleMultiSelect } from "@/components/reception/RoleMultiSelect";
import { PasswordField } from "@/components/reception/PasswordField";
import { SALON_ROLES } from "@/lib/salon";
import type { StaffAccount } from "@/lib/types";

type RowAction = (formData: FormData) => void | Promise<void>;

export function StaffRow({
  account,
  kind,
  dateLabel,
  initialEditOpen,
  editError,
  justUpdated,
  approveAction,
  rejectAction,
  updateAction,
  reactivateAction,
  variant = "row",
}: {
  account: StaffAccount;
  kind: "pending" | "approved" | "deactivated";
  dateLabel: string;
  initialEditOpen: boolean;
  editError: string | null;
  /**
   * A token that changes on every successful save of THIS row (null when this
   * row wasn't the one updated). Whenever it changes to a truthy value, the
   * inline editor collapses — robust even across consecutive edits.
   */
  justUpdated: string | null;
  approveAction: RowAction;
  rejectAction: RowAction;
  updateAction: RowAction;
  reactivateAction: RowAction;
  /** "row" = desktop table row; "card" = stacked mobile card. */
  variant?: "row" | "card";
}) {
  const [editing, setEditing] = useState(initialEditOpen);
  const [reactivating, setReactivating] = useState(false);

  // After a successful save the page re-renders but React keeps this
  // component's state, so collapse the editor back to read mode. The token
  // changes on every save, so this fires even on repeat edits of the same row.
  useEffect(() => {
    if (justUpdated) setEditing(false);
  }, [justUpdated]);

  const roles = account.roles?.length
    ? account.roles
    : account.role
    ? [account.role]
    : [];

  const roleBadges = (
    <div className="mt-1 flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className="inline-block rounded-full bg-ink-900/10 px-2 py-0.5 text-[10px] font-medium text-ink-700"
        >
          {r}
        </span>
      ))}
    </div>
  );

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="rounded-md border border-ink-900/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-700 hover:bg-ink-900/5"
      >
        {editing ? "Close" : "Edit"}
      </button>
      {kind === "pending" && (
        <form action={approveAction}>
          <input type="hidden" name="id" value={account.id} />
          <SubmitButton
            pendingText="Approving…"
            className="rounded-md bg-ink-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50 hover:bg-ink-700"
          >
            Approve
          </SubmitButton>
        </form>
      )}
      {kind === "deactivated" ? (
        <button
          type="button"
          onClick={() => setReactivating((v) => !v)}
          className="rounded-md bg-green-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50 hover:bg-green-800"
        >
          {reactivating ? "Close" : "Reactivate"}
        </button>
      ) : (
        <form action={rejectAction}>
          <input type="hidden" name="id" value={account.id} />
          <SubmitButton
            pendingText="Working…"
            className="rounded-md border border-red-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-700 hover:bg-red-50"
          >
            {kind === "pending" ? "Reject" : "Revoke"}
          </SubmitButton>
        </form>
      )}
    </>
  );

  // Reactivate panel: lets the owner restore access and, for staff who have
  // forgotten their password, set a temporary one (the username is unchanged).
  const reactivateForm = (
    <form action={reactivateAction} className="space-y-4">
      <input type="hidden" name="id" value={account.id} />
      <p className="text-xs text-ink-600">
        Restores access for{" "}
        <span className="font-semibold text-ink-900">{account.username}</span>.
        Optionally set a temporary password — they&apos;ll be asked to choose a
        new one on their next sign-in. Leave it blank to keep their old
        password.
      </p>
      <div className="max-w-xs">
        <PasswordField
          id={`reactivate-pw-${account.id}`}
          name="tempPassword"
          label="Temporary password (optional, min 8)"
          required={false}
          minLength={8}
          placeholder="leave blank to keep current"
        />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton
          pendingText="Reactivating…"
          className="rounded-md bg-green-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-cream-50 hover:bg-green-800"
        >
          Reactivate account
        </SubmitButton>
        <button
          type="button"
          onClick={() => setReactivating(false)}
          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const editForm = (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="id" value={account.id} />
      {editError && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {editError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Full name
          </span>
          <input
            name="fullName"
            type="text"
            required
            defaultValue={account.fullName}
            autoComplete="name"
            className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-600"
          />
        </label>
        <div className="sm:col-span-2">
          <RoleMultiSelect
            id={`roles-${account.id}`}
            name="roles"
            label="Roles (select one or more)"
            options={SALON_ROLES}
            defaultSelected={roles}
          />
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Phone (optional, 10 digits)
          </span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            defaultValue={account.phoneNumber ?? ""}
            placeholder="leave blank if none"
            className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-600"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Email (optional)
          </span>
          <input
            name="email"
            type="email"
            defaultValue={account.email ?? ""}
            autoComplete="email"
            placeholder="leave blank if none"
            className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-600"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  // ── Mobile: stacked card ────────────────────────────────────────────
  if (variant === "card") {
    return (
      <li data-focus-id={`staff-${account.id}`} className="p-4">
        <div className="font-semibold text-ink-900">{account.fullName}</div>
        {roleBadges}
        <dl className="mt-3 space-y-1 text-xs text-ink-600">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">Username</dt>
            <dd className="min-w-0 break-all text-ink-700">
              {account.username}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">Phone</dt>
            <dd className="min-w-0 break-all">{account.phoneNumber || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">Email</dt>
            <dd className="min-w-0 break-all">{account.email || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-ink-400">
              {kind === "pending" ? "Requested" : "Approved"}
            </dt>
            <dd className="min-w-0">{dateLabel}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">{actionButtons}</div>
        {editing && (
          <div className="mt-4 rounded-xl bg-cream-100/60 p-4">{editForm}</div>
        )}
        {reactivating && (
          <div className="mt-4 rounded-xl bg-green-50 p-4">{reactivateForm}</div>
        )}
      </li>
    );
  }

  // ── Desktop: table row (+ inline edit row) ──────────────────────────
  return (
    <>
      <tr
        data-focus-id={`staff-${account.id}`}
        className="border-b border-ink-900/5 last:border-b-0"
      >
        <td className="px-5 py-3">
          <div className="font-semibold text-ink-900">{account.fullName}</div>
          {roleBadges}
        </td>
        <td className="px-5 py-3 text-ink-700">{account.username}</td>
        <td className="px-5 py-3 text-xs text-ink-600">
          {account.phoneNumber || account.email ? (
            <>
              {account.phoneNumber && <div>{account.phoneNumber}</div>}
              {account.email && (
                <div className="text-ink-500">{account.email}</div>
              )}
            </>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </td>
        <td className="px-5 py-3 text-xs text-ink-600">{dateLabel}</td>
        <td className="px-5 py-3">
          <div className="flex justify-end gap-2">{actionButtons}</div>
        </td>
      </tr>

      {editing && (
        <tr className="border-b border-ink-900/5 bg-cream-100/60 last:border-b-0">
          <td colSpan={5} className="px-5 py-5">
            {editForm}
          </td>
        </tr>
      )}

      {reactivating && (
        <tr className="border-b border-ink-900/5 bg-green-50 last:border-b-0">
          <td colSpan={5} className="px-5 py-5">
            {reactivateForm}
          </td>
        </tr>
      )}
    </>
  );
}
