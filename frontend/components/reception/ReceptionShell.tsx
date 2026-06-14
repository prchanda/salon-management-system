"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/reception/auth";
import { SignOutButton } from "./SignOutButton";
import { NotificationsProvider, NotificationBell } from "./Notifications";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  nav: NavItem[];
  role: string;
  displayName?: string | null;
  children: React.ReactNode;
}

/**
 * Reception app shell — persistent left sidebar on desktop, slide-in drawer
 * on mobile. Replaces the older top-bar nav that was getting too crowded
 * once the Shop, Orders and Journal entries were added.
 */
export function ReceptionShell({ nav, role, displayName, children }: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the user navigates.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const currentLabel =
    [...nav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) =>
        n.href === "/reception"
          ? pathname === "/reception"
          : pathname === n.href || pathname.startsWith(`${n.href}/`)
      )?.label ?? "Reception";

  return (
    <NotificationsProvider>
    <div className="min-h-screen bg-cream-100 lg:flex">
      {/* ─── Mobile top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-900/10 bg-cream-50 px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-900 hover:bg-cream-100"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link
            href="/reception"
            className="font-serif text-base text-ink-900"
          >
            {currentLabel}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          {displayName && (
            <span className="max-w-[7rem] truncate text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              {displayName}
            </span>
          )}
        </div>
      </header>

      {/* ─── Desktop sidebar ────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 border-r border-ink-900/10 bg-cream-50 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <SidebarBody
          nav={nav}
          pathname={pathname}
          role={role}
          displayName={displayName}
          showBell
        />
      </aside>

      {/* ─── Mobile drawer ──────────────────────────────────────────── */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-[100dvh] w-72 max-w-[85vw] flex-col border-r border-ink-900/10 bg-cream-50 shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-14 items-center justify-end border-b border-ink-900/10 px-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-900 hover:bg-cream-100"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <SidebarBody
              nav={nav}
              pathname={pathname}
              role={role}
              displayName={displayName}
            />
          </aside>
        </>
      )}

      {/* ─── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
    </NotificationsProvider>
  );
}

interface SidebarBodyProps {
  nav: NavItem[];
  pathname: string;
  role: string;
  displayName?: string | null;
  showBell?: boolean;
}

function SidebarBody({
  nav,
  pathname,
  role,
  displayName,
  showBell = false,
}: SidebarBodyProps) {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Brand */}
      <div className="flex items-start justify-between gap-2 border-b border-ink-900/10 px-6 py-5">
        <div className="min-w-0">
          <Link
            href="/reception"
            className="block font-serif text-lg leading-tight text-ink-900"
          >
            Mr. &amp; Mrs. Cuts{" "}
            <span className="italic text-gold-600">Salon</span>
          </Link>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Reception
          </span>
        </div>
        {showBell && <NotificationBell className="-mr-2 shrink-0" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: user + sign out */}
      <div className="border-t border-ink-900/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {displayName && (
          <div className="mb-2 px-3 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              Signed in
            </p>
            <p
              className="truncate text-sm font-medium text-ink-900"
              title={displayName}
            >
              {displayName}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-gold-600">
              {role === "owner" ? "Owner" : "Staff"}
            </p>
          </div>
        )}
        <form action={logoutAction}>
          <SignOutButton />
        </form>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive =
    item.href === "/reception"
      ? pathname === "/reception"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-gold-600/10 text-ink-900"
          : "text-ink-600 hover:bg-cream-100 hover:text-ink-900"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold-600 transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <NavIcon href={item.href} active={isActive} />
      <span>{item.label}</span>
    </Link>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const cls = `h-4 w-4 shrink-0 ${active ? "text-gold-600" : "text-ink-400 group-hover:text-ink-700"}`;
  const props = {
    className: cls,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (href) {
    case "/reception":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "/reception/new":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "/reception/customers":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M21.5 18a4.5 4.5 0 0 0-4-4.4" />
        </svg>
      );
    case "/reception/dormant":
      return (
        <svg {...props}>
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "/reception/orders":
      return (
        <svg {...props}>
          <path d="M6 2l-3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-3-6z" />
          <path d="M3 8h18" />
          <path d="M16 12a4 4 0 0 1-8 0" />
        </svg>
      );
    case "/reception/summary":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
    case "/reception/services":
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M8.1 8.1L20 20" />
          <path d="M8.1 15.9L20 4" />
          <path d="M12 12l3 3" />
        </svg>
      );
    case "/reception/products":
      return (
        <svg {...props}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      );
    case "/reception/blog":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
          <path d="M4 19.5V21h14" />
        </svg>
      );
    case "/reception/reviews":
      return (
        <svg {...props}>
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z" />
        </svg>
      );
    case "/reception/staff":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
