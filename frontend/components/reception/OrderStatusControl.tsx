"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductOrder } from "@/lib/types";

type LifecycleAction = "confirm" | "complete" | "cancel";

interface ActionDef {
  action: LifecycleAction;
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger";
  confirm?: string;
}

const ACTIONS_BY_STATUS: Record<string, ActionDef[]> = {
  Pending: [
    {
      action: "confirm",
      label: "Confirm",
      pendingLabel: "Confirming…",
      variant: "primary",
    },
    {
      action: "cancel",
      label: "Cancel",
      pendingLabel: "Cancelling…",
      variant: "danger",
      confirm: "Cancel this order? Stock will be returned to inventory.",
    },
  ],
  Confirmed: [
    {
      action: "complete",
      label: "Mark complete",
      pendingLabel: "Completing…",
      variant: "primary",
    },
    {
      action: "cancel",
      label: "Cancel",
      pendingLabel: "Cancelling…",
      variant: "danger",
      confirm: "Cancel this order? Stock will be returned to inventory.",
    },
  ],
  Completed: [],
  Cancelled: [],
};

interface Props {
  order: ProductOrder;
  /** Horizontal alignment of the badge/buttons stack. Defaults to "end"
   *  (right-aligned) to suit the desktop table's Status column; the mobile
   *  card passes "start" so the controls hug the left edge with no dead space. */
  align?: "start" | "end";
}

export function OrderStatusControl({ order, align = "end" }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<LifecycleAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [amount, setAmount] = useState(String(order.totalAmount ?? ""));
  const [method, setMethod] = useState("UPI");

  const actions = ACTIONS_BY_STATUS[order.status] ?? [];

  // Clear the in-flight indicator once the parent re-renders with the new
  // status from router.refresh(). Without this, the just-pressed button's
  // "busy" state would persist and leave the next set of actions disabled.
  useEffect(() => {
    setBusyAction(null);
    setCompleting(false);
  }, [order.status]);

  async function run(def: ActionDef) {
    if (busyAction) return;
    // Completing a sale opens an inline form to capture the final price and
    // payment method (so reception can apply a discount at the till).
    if (def.action === "complete") {
      setError(null);
      setAmount(String(order.totalAmount ?? ""));
      setCompleting(true);
      return;
    }
    if (def.confirm && !window.confirm(def.confirm)) return;
    setError(null);
    setBusyAction(def.action);
    try {
      await api.updateProductOrderStatus(order.id, def.action);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      setBusyAction(null);
    }
  }

  async function complete() {
    if (busyAction) return;
    setError(null);
    setBusyAction("complete");
    try {
      await api.updateProductOrderStatus(order.id, "complete", {
        amountPaid: Number(amount) || 0,
        paymentMethod: method,
      });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      setBusyAction(null);
    }
  }

  if (completing) {
    const isBusy = busyAction === "complete";
    return (
      <div className="w-full max-w-xs rounded-xl border border-ink-900/10 bg-cream-50 p-3 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
          Complete sale
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            ₹
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="w-24 rounded-md border border-ink-900/15 bg-cream-50 px-2 py-1 text-sm"
            placeholder="Amount"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="appearance-none rounded-md border border-ink-900/15 bg-cream-50 py-1 pl-2 pr-7 text-sm"
          >
            <option>UPI</option>
            <option>Cash</option>
            <option>Card</option>
            <option>Other</option>
          </select>
        </div>
        <p className="mt-1.5 text-[10px] text-ink-400">
          Listed total ₹{order.totalAmount}. Edit to apply a discount.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={complete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold-600 bg-gold-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-gold-700 disabled:cursor-progress disabled:opacity-60"
          >
            {isBusy && <Spinner />}
            {isBusy ? "Completing…" : "Confirm sale"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setCompleting(false)}
            className="text-[10px] uppercase tracking-widest text-ink-400 hover:underline disabled:opacity-60"
          >
            dismiss
          </button>
        </div>
        {error && <p className="mt-2 text-[10px] text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 ${
        align === "start" ? "items-start" : "items-end"
      }`}
    >
      <StatusBadge status={order.status} />
      {actions.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-1.5 ${
            align === "start" ? "justify-start" : "justify-end"
          }`}
        >
          {actions.map((def) => {
            const isBusy = busyAction === def.action;
            const isDisabled = busyAction !== null;
            const base =
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50";
            const tone =
              def.variant === "primary"
                ? "border-gold-600 bg-gold-600 text-white hover:bg-gold-700"
                : "border-red-300 bg-cream-50 text-red-700 hover:bg-red-50";
            return (
              <button
                key={def.action}
                type="button"
                onClick={() => run(def)}
                disabled={isDisabled}
                aria-busy={isBusy}
                className={`${base} ${tone}`}
              >
                {isBusy && <Spinner />}
                {isBusy ? def.pendingLabel : def.label}
              </button>
            );
          })}
        </div>
      )}
      {error && (
        <span
          className={`max-w-[16rem] text-[10px] text-red-700 ${
            align === "start" ? "text-left" : "text-right"
          }`}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case "Confirmed":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "Completed":
      return "border-green-300 bg-green-50 text-green-700";
    case "Cancelled":
      return "border-ink-300 bg-cream-100 text-ink-500";
    case "Pending":
    default:
      return "border-amber-300 bg-amber-50 text-amber-800";
  }
}

function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
