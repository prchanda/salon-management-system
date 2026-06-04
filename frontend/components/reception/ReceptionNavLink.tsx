"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  label: string;
  className?: string;
}

export function ReceptionNavLink({ href, label, className }: Props) {
  const pathname = usePathname() ?? "";
  const isActive =
    href === "/reception"
      ? pathname === "/reception"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative pb-1 transition-colors ${
        isActive
          ? "text-ink-900"
          : "text-ink-600 hover:text-ink-900"
      } ${className ?? ""}`}
    >
      {label}
      <span
        aria-hidden
        className={`absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-gold-600 transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
}
