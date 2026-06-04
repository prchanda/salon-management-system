"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Props {
  date: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
  isToday: boolean;
  prevDate: string;
  nextDate: string;
}

export function DateNav({ date, today, isToday, prevDate, nextDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(target: string) {
    const href =
      target === today ? "/reception" : `/reception?date=${target}`;
    startTransition(() => router.push(href));
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <Link
        href={`/reception?date=${prevDate}`}
        aria-label="Previous day"
        className="btn-outline !py-2 !px-3 text-[11px]"
      >
        ←
      </Link>
      {!isToday && (
        <Link href="/reception" className="btn-outline !py-2 !px-3 text-[11px]">
          Today
        </Link>
      )}
      <input
        type="date"
        value={date}
        onChange={(e) => {
          if (e.target.value) go(e.target.value);
        }}
        className="rounded-md border border-ink-900/15 bg-cream-50 px-3 py-2 text-sm"
      />
      <Link
        href={`/reception?date=${nextDate}`}
        aria-label="Next day"
        className="btn-outline !py-2 !px-3 text-[11px]"
      >
        →
      </Link>
      <Link href="/reception/new" className="btn-primary !py-2 !px-4 text-[11px]">
        + New
      </Link>
      {pending && (
        <span
          aria-live="polite"
          className="text-[10px] uppercase tracking-widest text-ink-500"
        >
          Loading…
        </span>
      )}
    </div>
  );
}
