import Image from "next/image";

type Props = {
  className?: string;
  /** Pixel size of the rendered logo (square). Defaults to 48. */
  size?: number;
  /** Optional thin gold ring around the badge. */
  bordered?: boolean;
  ariaLabel?: string;
};

/**
 * Mr. & Mrs. Cuts brand mark. Rendered from /images/logo.jpg inside a
 * round container so it sits well on any background.
 */
export function Logo({
  className,
  size = 48,
  bordered = true,
  ariaLabel = "Mr. & Mrs. Cuts Salon",
}: Props) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-cream-50 ${
        bordered ? "ring-1 ring-gold-600/40" : ""
      } ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
    >
      <Image
        src="/images/logo.jpg"
        alt={ariaLabel}
        width={size * 2}
        height={size * 2}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
