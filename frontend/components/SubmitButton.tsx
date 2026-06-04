"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

/**
 * Submit button that shows a spinner + alternate label while the
 * surrounding server-action form is being processed. Wrap any
 * `<form action={serverAction}>` with this in place of `<button>`.
 */
export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary w-full",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-progress disabled:opacity-70`}
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
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
      )}
      <span>{pending ? pendingText ?? "Please wait…" : children}</span>
    </button>
  );
}
