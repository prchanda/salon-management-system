"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

interface Props {
  customerId: number;
  initial: string;
}

export function CustomerNotesEditor({ customerId, initial }: Props) {
  const [notes, setNotes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.updateCustomerNotes(customerId, notes.trim() || null);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-cream-50 p-6 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl text-ink-900">Notes</h2>
        {saved && <span className="text-xs text-emerald-700">Saved ✓</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Allergies, preferences, anything to remember…"
        className="mt-3 w-full rounded-md border border-ink-900/15 bg-cream-50 p-3 text-sm focus:border-ink-900 focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-outline inline-flex items-center gap-1.5 !py-1.5 !px-4 text-[10px] disabled:cursor-progress disabled:opacity-70"
        >
          {saving && <Spinner className="h-3 w-3" />}
          {saving ? "Saving…" : "Save notes"}
        </button>
      </div>
    </section>
  );
}
