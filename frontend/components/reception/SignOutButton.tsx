"use client";

import { useFormStatus } from "react-dom";

/**
 * Sign-out button for the reception sidebar. Lives in its own client component
 * so it can read `useFormStatus()` from the surrounding `<form action={...}>`
 * and show a spinner while the logout server action + redirect are in flight —
 * otherwise the button looks frozen during the round-trip.
 */
export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink-500 hover:bg-cream-100 hover:text-ink-900 disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
          <path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        </svg>
      )}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
