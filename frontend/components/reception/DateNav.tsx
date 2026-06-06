"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Props {
  date: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
  isToday: boolean;
  prevDate: string;
  nextDate: string;
}

type PendingTarget = "prev" | "next" | "today" | "picker" | null;

export function DateNav({ date, today, isToday, prevDate, nextDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<PendingTarget>(null);

  // Once the new page is rendered (pending flips back to false), clear the
  // spinner target so the arrows return to their normal labels.
  useEffect(() => {
    if (!pending) setPendingTarget(null);
  }, [pending]);

  function go(target: string, which: PendingTarget) {
    if (pending) return;
    setPendingTarget(which);
    const href = target === today ? "/reception" : `/reception?date=${target}`;
    startTransition(() => router.push(href));
  }

  return (
    <>
      {/* Top progress bar — visible while we wait for the next day's data. */}
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
          ←
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

        <input
          type="date"
          value={date}
          disabled={pending}
          onChange={(e) => {
            if (e.target.value) go(e.target.value, "picker");
          }}
          className="rounded-md border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
        />

        <NavButton
          ariaLabel="Next day"
          onClick={() => go(nextDate, "next")}
          disabled={pending}
          showSpinner={pending && pendingTarget === "next"}
        >
          →
        </NavButton>

        <a
          href="/reception/new"
          className="btn-primary !py-2 !px-4 text-[11px]"
        >
          + New
        </a>

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
