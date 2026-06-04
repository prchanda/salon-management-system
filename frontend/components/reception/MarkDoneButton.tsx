"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  appointmentId: number;
  suggestedAmount: number;
}

export function MarkDoneButton({ appointmentId, suggestedAmount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount || ""));
  const [method, setMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close(status: "Done" | "NoShow" | "Cancelled") {
    setSubmitting(true);
    setError(null);
    try {
      await api.markAppointmentDone(appointmentId, {
        status,
        amountPaid: status === "Done" ? Number(amount) || 0 : undefined,
        paymentMethod: status === "Done" ? method : undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline !py-1.5 !px-3 text-[10px]"
      >
        Close
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-ink-900/10 bg-cream-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
          ₹
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded-md border border-ink-900/15 bg-cream-50 px-2 py-1 text-sm"
          placeholder="Amount"
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded-md border border-ink-900/15 bg-cream-50 px-2 py-1 text-sm"
        >
          <option>UPI</option>
          <option>Cash</option>
          <option>Card</option>
          <option>Other</option>
        </select>
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("Done")}
          className="btn-primary !py-1.5 !px-3 text-[10px]"
        >
          Mark Done
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("NoShow")}
          className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 hover:underline"
        >
          No-show
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("Cancelled")}
          className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 hover:underline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] uppercase tracking-widest text-ink-400 hover:underline"
        >
          dismiss
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
