"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

interface Props {
  customerId: number;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
}

export function CustomerDetailsEditor({
  customerId,
  fullName,
  phoneNumber,
  email,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(phoneNumber ?? "");
  const [mail, setMail] = useState(email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(fullName);
    setPhone(phoneNumber ?? "");
    setMail(email ?? "");
    setError(null);
  }

  async function save() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedMail = mail.trim();

    if (trimmedName.length < 2) {
      setError("Please enter the customer's full name.");
      return;
    }
    if (trimmedPhone.length > 0 && !/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (trimmedMail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedMail)) {
      setError("Please enter a valid email address, or leave it blank.");
      return;
    }

    setSaving(true);
    try {
      await api.updateCustomer(customerId, {
        fullName: trimmedName,
        phoneNumber: trimmedPhone || null,
        email: trimmedMail || null,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(extractMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline !py-1.5 !px-4 text-[10px]"
      >
        Edit details
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink-900/10 bg-cream-100 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-600">
        Edit customer details
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Full name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Phone (10 digits)
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={10}
            placeholder="leave blank if none"
            className="input-field !py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Email (optional)
          </span>
          <input
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            type="email"
            placeholder="leave blank if none"
            className="input-field !py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-1.5 !py-1.5 !px-4 text-[11px] disabled:cursor-progress disabled:opacity-70"
        >
          {saving && <Spinner light className="h-3 w-3" />}
          {saving ? "Saving…" : "Save details"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="btn-outline !py-1.5 !px-4 text-[11px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function extractMessage(error: unknown): string {
  const fallback = "Could not save the details. Please try again.";
  if (!(error instanceof Error)) return fallback;
  const dashIndex = error.message.indexOf(" - ");
  if (dashIndex === -1) return error.message || fallback;
  const body = error.message.slice(dashIndex + 3).trim();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    return parsed.message?.trim() || fallback;
  } catch {
    return body || fallback;
  }
}
