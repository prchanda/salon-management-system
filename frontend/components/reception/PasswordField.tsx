"use client";

import { useState } from "react";

interface Props {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
}

/**
 * Password input that is masked by default with an eye toggle to reveal it.
 * Used for the owner-chosen temporary staff password so it can be read back
 * without leaving it exposed on screen.
 */
export function PasswordField({
  id,
  name,
  label,
  required = true,
  autoComplete = "new-password",
  placeholder,
  minLength,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          className="w-full rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 pr-10 text-sm text-ink-900 outline-none focus:border-gold-600"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-700"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
