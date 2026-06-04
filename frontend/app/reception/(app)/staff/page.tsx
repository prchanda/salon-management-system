import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import { approveStaffAction, rejectStaffAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
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
  searchParams: { error?: string };
}) {
  if (getRole() !== "owner") {
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
  const approved = accounts.filter((a) => a.isApproved);

  const actionError =
    searchParams.error === "approve"
      ? "Could not approve that account. Please try again."
      : searchParams.error === "reject"
      ? "Could not revoke that account. Please try again."
      : null;

  return (
    <div className="space-y-10">
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

      <Section
        title={`Pending approval (${pending.length})`}
        empty="No one waiting for approval."
        accounts={pending}
        kind="pending"
      />

      <Section
        title={`Active accounts (${approved.length})`}
        empty="No active staff accounts yet."
        accounts={approved}
        kind="approved"
      />
    </div>
  );
}

function Section({
  title,
  empty,
  accounts,
  kind,
}: {
  title: string;
  empty: string;
  accounts: StaffAccount[];
  kind: "pending" | "approved";
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink-900">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-2xl bg-cream-50 shadow-soft">
        {accounts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">{empty}</p>
        ) : (
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
                <tr
                  key={a.id}
                  className="border-b border-ink-900/5 last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-ink-900">
                      {a.fullName}
                    </div>
                    <div className="text-xs text-ink-500">{a.role}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-700">@{a.username}</td>
                  <td className="px-5 py-3 text-xs text-ink-600">
                    <div>{a.email || "—"}</div>
                    <div className="text-ink-500">{a.phoneNumber || "—"}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-600">
                    {fmtDate(
                      kind === "pending" ? a.registeredAt : a.approvedAt
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {kind === "pending" && (
                        <form action={approveStaffAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <SubmitButton
                            pendingText="Approving…"
                            className="rounded-md bg-ink-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50 hover:bg-ink-700"
                          >
                            Approve
                          </SubmitButton>
                        </form>
                      )}
                      <form action={rejectStaffAction}>
                        <input type="hidden" name="id" value={a.id} />
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
