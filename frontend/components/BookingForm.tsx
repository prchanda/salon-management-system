"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Service, Staff } from "@/lib/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-ink-900/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none ring-gold-600/30 transition focus:border-gold-600 focus:ring-2";
const labelClass =
  "block text-xs font-semibold uppercase tracking-widest text-ink-700";

// Salon hours: 10:30 AM – 8:30 PM. Offer 30-minute slots up to 8:00 PM.
function buildTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let minutes = 10 * 60 + 30; minutes <= 20 * 60; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const period = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${h12}:${String(m).padStart(2, "0")} ${period}`;
    slots.push({ value, label });
  }
  return slots;
}

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function BookingForm({
  services,
  staff,
}: {
  services: Service[];
  staff: Staff[];
}) {
  const timeSlots = useMemo(buildTimeSlots, []);
  const minDate = useMemo(todayIso, []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [staffId, setStaffId] = useState<number | "">("");
  const [date, setDate] = useState(minDate);
  const [time, setTime] = useState(timeSlots[0]?.value ?? "11:00");
  const [remarks, setRemarks] = useState("");
  // Honeypot — must stay empty. Hidden from real users; only bots fill it.
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    const ph = phone.trim();

    if (!name) {
      setError("Please tell us your name.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(ph)) {
      setError("Please enter a valid phone number so we can confirm.");
      return;
    }
    if (!serviceId) {
      setError("Please choose a service.");
      return;
    }
    if (!date) {
      setError("Please pick a date.");
      return;
    }
    if (!time) {
      setError("Please pick a time.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createAppointment({
        phoneNumber: ph,
        fullName: name,
        serviceId: Number(serviceId),
        staffId: staffId ? Number(staffId) : undefined,
        appointmentDate: date,
        appointmentTime: `${time}:00`,
        remarks: remarks.trim() || undefined,
        website: website || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const selectedService = services.find((s) => s.id === Number(serviceId));
    const slotLabel = timeSlots.find((t) => t.value === time)?.label ?? time;
    return (
      <div className="rounded-2xl border border-gold-600/30 bg-cream-100 p-8 text-center">
        <p className="text-gold-600" aria-hidden>
          ✓
        </p>
        <h2 className="mt-4 font-serif text-2xl text-ink-900">
          Your request is in.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          Thank you, {fullName.trim()}. We&apos;ve received your request
          {selectedService ? ` for ${selectedService.serviceName}` : ""} on{" "}
          {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          at {slotLabel}. Our team will call you shortly to confirm.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot: hidden from real users, off-screen and excluded from tab
          order and accessibility tree. Bots that fill every field trip it. */}
      <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Your name
          </label>
          <input
            id="fullName"
            type="text"
            required
            maxLength={80}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aanya R."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            required
            maxLength={15}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 70032 32340"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="serviceId" className={labelClass}>
          Service
        </label>
        <select
          id="serviceId"
          required
          value={serviceId}
          onChange={(e) =>
            setServiceId(e.target.value ? Number(e.target.value) : "")
          }
          className={inputClass}
        >
          <option value="">Choose a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.serviceName} — ₹{s.price}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="staffId" className={labelClass}>
          Preferred specialist{" "}
          <span className="font-normal normal-case text-ink-500">
            (optional)
          </span>
        </label>
        <select
          id="staffId"
          value={staffId}
          onChange={(e) =>
            setStaffId(e.target.value ? Number(e.target.value) : "")
          }
          className={inputClass}
        >
          <option value="">No preference</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
              {s.role ? ` · ${s.role}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="time" className={labelClass}>
            Time
          </label>
          <select
            id="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          >
            {timeSlots.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="remarks" className={labelClass}>
          Notes{" "}
          <span className="font-normal normal-case text-ink-500">
            (optional)
          </span>
        </label>
        <textarea
          id="remarks"
          rows={3}
          maxLength={300}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Anything we should know before your visit…"
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
          )}
          {submitting ? "Sending…" : "Request appointment"}
        </button>
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">
          Cancel
        </Link>
      </div>

      <p className="text-xs text-ink-500">
        This sends a booking request. Our team will call you to confirm the
        final time and specialist.
      </p>
    </form>
  );
}
