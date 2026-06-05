"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Customer, Service, Staff } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<Customer | null>(null);
  const [lookupTried, setLookupTried] = useState(false);
  const [fullName, setFullName] = useState("");
  const [walkIn, setWalkIn] = useState(false);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [staffId, setStaffId] = useState<number | "">("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());
  const [remarks, setRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getStaff().then(setStaff).catch(() => setStaff([]));
  }, []);

  async function doLookup() {
    setLookupTried(true);
    setLookup(null);
    if (!phone.trim()) return;
    setLookingUp(true);
    try {
      const c = await api.getCustomerByPhone(phone.trim());
      setLookup(c);
      setFullName(c.fullName);
    } catch {
      setLookup(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!serviceId) {
      setError("Pick a service.");
      return;
    }
    if (!walkIn && !phone.trim() && !lookup) {
      setError("Add a phone number, or mark this as a walk-in.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createAppointment({
        customerId: lookup?.id,
        phoneNumber: walkIn || lookup ? undefined : phone.trim() || undefined,
        fullName:
          lookup
            ? undefined
            : (fullName.trim() || undefined),
        serviceId: Number(serviceId),
        staffId: staffId ? Number(staffId) : undefined,
        appointmentDate: date,
        appointmentTime: `${time}:00`,
        remarks: remarks.trim() || undefined,
      });
      router.push("/reception");
      // Invalidate the Router Cache so the bookings list re-fetches and
      // shows the appointment we just created without a manual refresh.
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Add</p>
      <h1 className="mt-2 font-serif text-3xl text-ink-900">
        New booking / walk-in
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Type the guest&apos;s phone first — we&apos;ll fetch their profile if
        we know them.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl bg-cream-50 p-6 shadow-soft">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
            Phone
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setLookup(null);
                setLookupTried(false);
                if (e.target.value.trim()) setWalkIn(false);
              }}
              placeholder="+91 98765 12345"
              className="input-field flex-1"
              disabled={walkIn}
            />
            <button
              type="button"
              onClick={doLookup}
              disabled={walkIn || lookingUp}
              className="btn-outline inline-flex items-center gap-1.5 !py-2 !px-4 text-[11px] disabled:cursor-progress disabled:opacity-70"
            >
              {lookingUp && <Spinner className="h-3 w-3" />}
              {lookingUp ? "Looking up…" : "Look up"}
            </button>
          </div>
          {lookup && (
            <p className="mt-2 text-xs text-emerald-700">
              ✓ Existing guest: {lookup.fullName}
              {lookup.notes ? ` · ${lookup.notes}` : ""}
            </p>
          )}
          {lookupTried && !lookup && !walkIn && (
            <p className="mt-2 text-xs text-ink-500">
              New guest — please enter their name below.
            </p>
          )}
          <label className="mt-3 flex items-center gap-2 text-xs text-ink-600">
            <input
              type="checkbox"
              checked={walkIn}
              onChange={(e) => {
                setWalkIn(e.target.checked);
                if (e.target.checked) {
                  setPhone("");
                  setLookup(null);
                  setLookupTried(false);
                }
              }}
            />
            Walk-in — skip phone for now (can be added later)
          </label>
        </div>

        {!lookup && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
              {walkIn ? "Guest label (optional)" : "Full name"}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={walkIn ? "Walk-in" : "Guest's name"}
              className="input-field mt-2"
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) =>
                setServiceId(e.target.value ? Number(e.target.value) : "")
              }
              className="input-field mt-2"
              required
            >
              <option value="">— Pick —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} (₹{s.price})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
              Specialist
            </label>
            <select
              value={staffId}
              onChange={(e) =>
                setStaffId(e.target.value ? Number(e.target.value) : "")
              }
              className="input-field mt-2"
            >
              <option value="">Assign later</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field mt-2"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field mt-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-600">
            Remarks
          </label>
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Anything to remember…"
            className="input-field mt-2"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/reception")}
            className="btn-outline !py-2 !px-4 text-[11px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-4 text-[11px] disabled:cursor-progress disabled:opacity-70"
          >
            {submitting && <Spinner light className="h-3 w-3" />}
            {submitting ? "Saving…" : "Save booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
