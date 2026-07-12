import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRole, getDisplayName, getStaffId } from "../roles";
import { RECEPTION_PW_SET_COOKIE, RECEPTION_MUST_CHANGE_COOKIE } from "../roles";
import { api } from "@/lib/api";
import { ReceptionShell } from "@/components/reception/ReceptionShell";

export const metadata = {
  title: "Reception",
};

const nav = [
  { href: "/reception", label: "Bookings", ownerOnly: false },
  { href: "/reception/new", label: "New booking", ownerOnly: false },
  { href: "/reception/customers", label: "Customers", ownerOnly: true },
  { href: "/reception/dormant", label: "Re-engage", ownerOnly: true },
  { href: "/reception/orders", label: "Orders", ownerOnly: true },
  { href: "/reception/summary", label: "Day summary", ownerOnly: true },
  { href: "/reception/reports", label: "Reports", ownerOnly: true },
  { href: "/reception/services", label: "Services", ownerOnly: true },
  { href: "/reception/products", label: "Shop", ownerOnly: true },
  { href: "/reception/blog", label: "Journal", ownerOnly: true },
  { href: "/reception/announcement", label: "Announcement", ownerOnly: true },
  { href: "/reception/reviews", label: "Reviews", ownerOnly: true },
  { href: "/reception/staff", label: "Staff", ownerOnly: true },
];

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRole();
  const displayName = await getDisplayName();

  // Server-side enforcement of the forced first-login password change.
  // This closes the gap where a user could delete the must-change cookie
  // to bypass the middleware redirect. Applies to the owner too.
  const staffId = await getStaffId();
  // Skip the gate entirely if the password was just set: the short-lived
  // marker cookie means the change is done even if a read replica still
  // reports it as pending, so we must NOT redirect back to change-password
  // (that fights the change-password page and crashes the client router).
  const justSetPassword =
    cookies().get(RECEPTION_PW_SET_COOKIE)?.value === "1";
  let mustChangePassword = false;
  if (staffId && !justSetPassword) {
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
    // The forced-change page must be entered via a fresh temp-password login,
    // which sets the must-change cookie. If the backend says a change is due
    // but that cookie is absent, this session predates the must-change state
    // (e.g. a session left over from before an account reset, or the owner
    // forcing a password reset on an already-signed-in user). Rather than
    // dropping them onto change-password without authenticating, require a
    // fresh login — logging in re-establishes the must-change cookie and then
    // routes them to change-password the intended way.
    const cameFromTempLogin =
      cookies().get(RECEPTION_MUST_CHANGE_COOKIE)?.value === "1";
    redirect(
      cameFromTempLogin ? "/reception/change-password" : "/reception/login"
    );
  }

  const visibleNav = nav
    .filter((n) => role === "owner" || !n.ownerOnly)
    .map(({ href, label }) => ({ href, label }));

  return (
    <ReceptionShell
      nav={visibleNav}
      role={role ?? ""}
      displayName={displayName}
    >
      {children}
    </ReceptionShell>
  );
}
