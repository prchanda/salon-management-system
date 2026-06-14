"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Spinner } from "@/components/Spinner";

interface Props {
  /** The customer being kept. The chosen duplicate is merged into this one. */
  targetId: number;
  targetName: string;
}

export function MergeCustomerTool({ targetId, targetName }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function openTool() {
    setOpen(true);
    setError(null);
    setDone(null);
  }

  // Search server-side (debounced) so we never pull the whole customer table.
  // Runs an initial empty-query fetch on open to show recent customers.
  useEffect(() => {
    if (!open || selected) return;
    let cancelled = false;
    setLoadingList(true);
    const t = setTimeout(async () => {
      try {
        const results = await api.getCustomers(query.trim() || undefined, 50);
        if (!cancelled) setCustomers(results.filter((c) => c.id !== targetId));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, selected, query, targetId]);

  function reset() {
    setOpen(false);
    setQuery("");
    setSelected(null);
    setConfirming(false);
    setError(null);
  }

  const matches = customers;

  async function doMerge() {
    if (!selected) return;
    setMerging(true);
    setError(null);
    try {
      const res = await api.mergeCustomers(targetId, selected.id);
      setDone(
        `Merged "${selected.fullName}" into this profile. ` +
          `${res.mergedAppointmentCount} appointment${
            res.mergedAppointmentCount === 1 ? "" : "s"
          } moved over.`
      );
      reset();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMerging(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink-900/10 bg-cream-50 p-6 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl text-ink-900">Merge a duplicate</h2>
          <p className="mt-1 text-xs text-ink-500">
            Found the same guest under another record? Merge it in — all visits
            move here and the duplicate is removed.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={openTool}
            className="btn-outline !py-1.5 !px-4 text-[10px]"
          >
            Merge duplicate
          </button>
        )}
      </div>

      {done && (
        <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {done}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {open && (
        <div className="mt-5 space-y-4">
          {selected ? (
            <div className="rounded-xl border border-gold-600/30 bg-cream-100 p-4">
              <p className="text-sm text-ink-700">
                Merge{" "}
                <span className="font-semibold text-ink-900">
                  {selected.fullName}
                </span>
                {selected.phoneNumber ? ` (${selected.phoneNumber})` : ""} into{" "}
                <span className="font-semibold text-ink-900">{targetName}</span>?
              </p>
              <p className="mt-2 text-xs text-red-600">
                This permanently deletes the duplicate record. Its visit history
                will move to this profile. This cannot be undone.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={doMerge}
                  disabled={merging}
                  className="btn-primary inline-flex items-center gap-1.5 !py-1.5 !px-4 text-[10px] disabled:cursor-progress disabled:opacity-60"
                >
                  {merging && <Spinner light className="h-3 w-3" />}
                  {merging ? "Merging…" : "Confirm merge"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  disabled={merging}
                  className="text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the duplicate by name or phone…"
                className="w-full rounded-md border border-ink-900/15 bg-cream-50 p-3 text-sm focus:border-ink-900 focus:outline-none"
              />
              <div className="max-h-64 overflow-y-auto rounded-xl border border-ink-900/10">
                {loadingList ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-500">
                    Searching…
                  </p>
                ) : matches.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-500">
                    No other customers match.
                  </p>
                ) : (
                  <ul className="divide-y divide-ink-900/5">
                    {matches.slice(0, 50).map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream-100"
                        >
                          <span className="font-medium text-ink-900">
                            {c.fullName}
                          </span>
                          <span className="text-xs text-ink-500">
                            {c.phoneNumber ?? "no phone"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
