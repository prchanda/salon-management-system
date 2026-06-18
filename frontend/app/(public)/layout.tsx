import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { api } from "@/lib/api";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let announcement = null;
  try {
    announcement = await api.getAnnouncement();
  } catch {
    // A failed announcement fetch must never break the public site.
    announcement = null;
  }

  return (
    <>
      {announcement && <AnnouncementBar announcement={announcement} />}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
