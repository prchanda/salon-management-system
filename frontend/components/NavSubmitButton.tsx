"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";

interface Props {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

/**
 * Submit button for plain (GET) navigation forms — e.g. search / filter
 * bars — where `useFormStatus` does not report a pending state. Shows a
 * spinner from the moment it's clicked until the page finishes navigating.
 */
export function NavSubmitButton({
  children,
  pendingText,
  className = "btn-outline !py-2 !px-4 text-[11px]",
}: Props) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="submit"
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={`${className} inline-flex items-center justify-center gap-1.5 ${
        pending ? "cursor-progress opacity-70" : ""
      }`}
    >
      {pending && <Spinner className="h-3 w-3" />}
      <span>{pending ? pendingText ?? "Loading…" : children}</span>
    </button>
  );
}
