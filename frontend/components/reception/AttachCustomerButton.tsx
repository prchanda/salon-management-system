"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

interface Props {
  appointmentId: number;
  defaultName?: string | null;
}

export function AttachCustomerButton({ appointmentId, defaultName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState(
    defaultName && defaultName.trim().toLowerCase() !== "walk-in"
      ? defaultName
      : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!phone.trim()) {
      setError("Phone is required.");
      return;
    }
    setBusy(true);
    try {
      await api.attachCustomerToAppointment(appointmentId, {
        phoneNumber: phone.trim(),
        fullName: fullName.trim() || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-ink-900/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink-600 hover:bg-cream-100"
      >
        + Attach phone
      </button>
    );
  }

  return (
    <div className="basis-full rounded-xl border border-ink-900/10 bg-cream-100 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-600">
        Attach guest details
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="input-field !py-1.5 text-sm"
        />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Name (optional)"
          className="input-field !py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-primary inline-flex items-center gap-1.5 !py-1.5 !px-3 text-[11px] disabled:cursor-progress disabled:opacity-70"
          >
            {busy && <Spinner light className="h-3 w-3" />}
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-outline !py-1.5 !px-3 text-[11px]"
          >
            Cancel
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
