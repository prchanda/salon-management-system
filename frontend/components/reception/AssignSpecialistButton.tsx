"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Staff } from "@/lib/types";

interface Props {
  appointmentId: number;
}

export function AssignSpecialistButton({ appointmentId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffId, setStaffId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || staff.length > 0) return;
    api
      .getStaff()
      .then((list) => setStaff(list.filter((s) => s.isActive)))
      .catch(() => setStaff([]));
  }, [open, staff.length]);

  async function submit() {
    setError(null);
    if (!staffId) {
      setError("Pick a specialist.");
      return;
    }
    setBusy(true);
    try {
      await api.assignSpecialistToAppointment(appointmentId, {
        staffId: Number(staffId),
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
        + Assign specialist
      </button>
    );
  }

  return (
    <div className="basis-full rounded-xl border border-ink-900/10 bg-cream-100 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-600">
        Assign specialist
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          value={staffId}
          onChange={(e) =>
            setStaffId(e.target.value ? Number(e.target.value) : "")
          }
          className="input-field !py-1.5 text-sm"
        >
          <option value="">— Pick —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-primary !py-1.5 !px-3 text-[11px]"
          >
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
