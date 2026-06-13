import { redirect } from "next/navigation";
import { getRole, getDisplayName, getStaffId } from "../roles";
import { api } from "@/lib/api";
import { ReceptionShell } from "@/components/reception/ReceptionShell";

export const metadata = {
  title: "Reception — Mr. & Mrs. Cuts Salon",
};

const nav = [
  { href: "/reception", label: "Bookings", ownerOnly: false },
  { href: "/reception/new", label: "New booking", ownerOnly: false },
  { href: "/reception/customers", label: "Customers", ownerOnly: false },
  { href: "/reception/dormant", label: "Re-engage", ownerOnly: false },
  { href: "/reception/orders", label: "Orders", ownerOnly: false },
  { href: "/reception/summary", label: "Day summary", ownerOnly: true },
  { href: "/reception/services", label: "Services", ownerOnly: true },
  { href: "/reception/products", label: "Shop", ownerOnly: true },
  { href: "/reception/blog", label: "Journal", ownerOnly: true },
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
