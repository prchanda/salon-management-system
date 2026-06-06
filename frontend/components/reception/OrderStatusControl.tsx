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
}

export function OrderStatusControl({ order }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<LifecycleAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS_BY_STATUS[order.status] ?? [];

  // Clear the in-flight indicator once the parent re-renders with the new
  // status from router.refresh(). Without this, the just-pressed button's
  // "busy" state would persist and leave the next set of actions disabled.
  useEffect(() => {
    setBusyAction(null);
  }, [order.status]);

  async function run(def: ActionDef) {
    if (busyAction) return;
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

  return (
    <div className="flex flex-col items-end gap-2">
      <StatusBadge status={order.status} />
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {actions.map((def) => {
            const isBusy = busyAction === def.action;
            const isDisabled = busyAction !== null;
            const base =
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50";
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
        <span className="max-w-[16rem] text-right text-[10px] text-red-700">
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
