import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../auth";
import { getRole, getDisplayName, getStaffId } from "../roles";
import { api } from "@/lib/api";
import { ReceptionNavLink } from "@/components/reception/ReceptionNavLink";

export const metadata = {
  title: "Reception — Mr. & Mrs. Cuts Salon",
};

const nav = [
  { href: "/reception", label: "Bookings", ownerOnly: false },
  { href: "/reception/new", label: "New booking", ownerOnly: false },
  { href: "/reception/customers", label: "Customers", ownerOnly: false },
  { href: "/reception/dormant", label: "Re-engage", ownerOnly: false },
  { href: "/reception/summary", label: "Day summary", ownerOnly: true },
  { href: "/reception/blog", label: "Journal", ownerOnly: true },
  { href: "/reception/staff", label: "Staff", ownerOnly: true },
];

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = getRole();
  const displayName = getDisplayName();

  // Server-side enforcement of the forced first-login password change.
  // This closes the gap where a user could delete the must-change cookie
  // to bypass the middleware redirect. Applies to the owner too.
  const staffId = getStaffId();
  let mustChangePassword = false;
  if (staffId) {
    try {
      const status = await api.getStaffSessionStatus(staffId);
      mustChangePassword = status.mustChangePassword;
    } catch {
      // If the status can't be fetched, fail open to avoid locking out
      // staff during a backend hiccup; the cookie-based gate still applies.
    }
  }
  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  if (mustChangePassword) {
    redirect("/reception/change-password");
  }

  const visibleNav = nav.filter((n) => role === "owner" || !n.ownerOnly);

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <header className="border-b border-ink-900/10 bg-cream-50">
        <div className="container-page flex h-16 items-center justify-between gap-8">
          <Link
            href="/reception"
            className="shrink-0 font-serif text-xl text-ink-900"
          >
            Mr. & Mrs. Cuts <span className="italic text-gold-600">Salon</span>
            <span className="ml-2 text-[11px] uppercase tracking-widest text-ink-500">
              Reception
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-5 lg:gap-7 md:flex">
            {visibleNav.map((link) => (
              <ReceptionNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest"
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-4">
            {role === "staff" && displayName && (
              <span
                className="hidden rounded-full bg-ink-900/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink-700 sm:inline-block"
                title={displayName}
              >
                {displayName}
              </span>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="container-page flex gap-4 overflow-x-auto pb-3 md:hidden">
          {visibleNav.map((link) => (
            <ReceptionNavLink
              key={link.href}
              href={link.href}
              label={link.label}
              className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-widest"
            />
          ))}
        </nav>
      </header>

      <main className="container-page flex-1 py-8">{children}</main>
    </div>
  );
}
