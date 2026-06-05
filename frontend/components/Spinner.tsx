interface SpinnerProps {
  /** Use a light color (for dark/primary backgrounds). */
  light?: boolean;
  className?: string;
}

/**
 * Small inline loading spinner. Reuse across client components that run
 * async actions (form submits, API calls) so every long-running operation
 * shows consistent feedback.
 */
export function Spinner({ light = false, className }: SpinnerProps) {
  return (
    <svg
      className={`h-3.5 w-3.5 animate-spin ${
        light ? "text-cream-50" : "text-current"
      } ${className ?? ""}`}
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
  );
}
