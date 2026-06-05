"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleMultiSelect } from "@/components/reception/RoleMultiSelect";
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
}: {
  account: StaffAccount;
  kind: "pending" | "approved";
  dateLabel: string;
  initialEditOpen: boolean;
  editError: string | null;
  justUpdated: boolean;
  approveAction: RowAction;
  rejectAction: RowAction;
  updateAction: RowAction;
}) {
  const [editing, setEditing] = useState(initialEditOpen);

  // After a successful save the page re-renders but React keeps this
  // component's state, so collapse the editor back to read mode.
  useEffect(() => {
    if (justUpdated) setEditing(false);
  }, [justUpdated]);

  const roles = account.roles?.length
    ? account.roles
    : account.role
    ? [account.role]
    : [];

  return (
    <>
      <tr className="border-b border-ink-900/5 last:border-b-0">
        <td className="px-5 py-3">
          <div className="font-semibold text-ink-900">{account.fullName}</div>
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
        </td>
        <td className="px-5 py-3 text-ink-700">{account.username}</td>
        <td className="px-5 py-3 text-xs text-ink-600">
          <div>{account.email || "—"}</div>
          <div className="text-ink-500">{account.phoneNumber || "—"}</div>
        </td>
        <td className="px-5 py-3 text-xs text-ink-600">{dateLabel}</td>
        <td className="px-5 py-3">
          <div className="flex justify-end gap-2">
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
            <form action={rejectAction}>
              <input type="hidden" name="id" value={account.id} />
              <SubmitButton
                pendingText="Working…"
                className="rounded-md border border-red-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-700 hover:bg-red-50"
              >
                {kind === "pending" ? "Reject" : "Revoke"}
              </SubmitButton>
            </form>
          </div>
        </td>
      </tr>

      {editing && (
        <tr className="border-b border-ink-900/5 bg-cream-100/60 last:border-b-0">
          <td colSpan={5} className="px-5 py-5">
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
                    Phone (10 digits)
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    defaultValue={account.phoneNumber ?? ""}
                    placeholder="9876543210"
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
          </td>
        </tr>
      )}
    </>
  );
}
