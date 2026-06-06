"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Props {
  date: string; // YYYY-MM-DD currently selected
  today: string; // YYYY-MM-DD
  prevDate: string;
  nextDate: string;
}

type PendingTarget = "prev" | "next" | "today" | "picker" | null;

/**
 * Date nav for the reception day summary. Mirrors DateNav.tsx so navigating
 * routes through React's useTransition and shows a loader while the new day's
 * data is fetched (otherwise mobile users see a frozen UI followed by a sudden
 * re-render).
 */
export function SummaryDateNav({ date, today, prevDate, nextDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<PendingTarget>(null);
  const [picker, setPicker] = useState(date);

  // Keep the picker in sync if the URL date changes externally.
  useEffect(() => {
    setPicker(date);
  }, [date]);

  // Clear the per-control spinner once the transition settles.
  useEffect(() => {
    if (!pending) setPendingTarget(null);
  }, [pending]);

  const isToday = date === today;

  function go(target: string, which: PendingTarget) {
    if (pending) return;
    setPendingTarget(which);
    const href =
      target === today
        ? "/reception/summary"
        : `/reception/summary?date=${target}`;
    startTransition(() => router.push(href));
  }

  return (
    <>
      {pending && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-gold-600/20">
          <div className="h-full w-1/3 animate-[loader_1.2s_ease-in-out_infinite] bg-gold-600" />
          <style>{`@keyframes loader { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }`}</style>
        </div>
      )}

      <div
        className={`flex flex-wrap items-center gap-2 transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
        aria-busy={pending}
      >
        <NavButton
          ariaLabel="Previous day"
          onClick={() => go(prevDate, "prev")}
          disabled={pending}
          showSpinner={pending && pendingTarget === "prev"}
        >
          ← Prev
        </NavButton>

        {!isToday && (
          <NavButton
            ariaLabel="Jump to today"
            onClick={() => go(today, "today")}
            disabled={pending}
            showSpinner={pending && pendingTarget === "today"}
          >
            Today
          </NavButton>
        )}

        <NavButton
          ariaLabel="Next day"
          onClick={() => go(nextDate, "next")}
          disabled={pending}
          showSpinner={pending && pendingTarget === "next"}
        >
          Next →
        </NavButton>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={picker}
            disabled={pending}
            onChange={(e) => setPicker(e.target.value)}
            className="rounded-md border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
          />
          <NavButton
            ariaLabel="Go to selected date"
            onClick={() => {
              if (picker && picker !== date) go(picker, "picker");
            }}
            disabled={pending || !picker || picker === date}
            showSpinner={pending && pendingTarget === "picker"}
          >
            Go
          </NavButton>
        </div>

        {pending && (
          <span
            aria-live="polite"
            className="text-[10px] uppercase tracking-widest text-ink-500"
          >
            Loading…
          </span>
        )}
      </div>
    </>
  );
}

function NavButton({
  children,
  ariaLabel,
  onClick,
  disabled,
  showSpinner,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  disabled: boolean;
  showSpinner: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      aria-busy={showSpinner}
      className="btn-outline inline-flex items-center gap-1.5 !py-2 !px-3 text-[11px] disabled:cursor-wait disabled:opacity-60"
    >
      {showSpinner ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
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
