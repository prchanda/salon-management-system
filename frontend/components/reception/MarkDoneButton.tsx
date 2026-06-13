"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

interface Props {
  appointmentId: number;
  suggestedAmount: number;
}

type CloseStatus = "Done" | "NoShow" | "Cancelled";

export function MarkDoneButton({ appointmentId, suggestedAmount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount || ""));
  const [method, setMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<CloseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function close(status: CloseStatus) {
    setSubmitting(true);
    setPending(status);
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
      setPending(null);
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
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("Done")}
          className="btn-primary inline-flex items-center gap-1.5 !py-1.5 !px-3 text-[10px] disabled:cursor-progress disabled:opacity-70"
        >
          {pending === "Done" && <Spinner light className="h-3 w-3" />}
          {pending === "Done" ? "Saving…" : "Mark Done"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("NoShow")}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 hover:underline disabled:cursor-progress disabled:opacity-70"
        >
          {pending === "NoShow" && <Spinner className="h-3 w-3" />}
          {pending === "NoShow" ? "Saving…" : "No-show"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => close("Cancelled")}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500 hover:underline disabled:cursor-progress disabled:opacity-70"
        >
          {pending === "Cancelled" && <Spinner className="h-3 w-3" />}
          {pending === "Cancelled" ? "Saving…" : "Cancel"}
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
