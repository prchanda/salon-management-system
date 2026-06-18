import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRole } from "@/app/reception/roles";
import { api } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { AnnouncementForm } from "../../AnnouncementForm";
import { updateAnnouncementAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit announcement — Reception" };

export default async function EditAnnouncementPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { formError?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  let announcement: Announcement;
  try {
    announcement = await api.getAdminAnnouncementById(id);
  } catch {
    notFound();
  }

  // Only the latest announcement (highest id) is editable; every earlier one
  // is locked history. Guard the direct URL too, not just the list links.
  let latestId = id;
  try {
    const all = await api.getAdminAnnouncements();
    if (Array.isArray(all) && all.length > 0) {
      latestId = all.reduce((max, a) => (a.id > max ? a.id : max), -Infinity);
    }
  } catch {
    // If the list can't be loaded, fall back to the end-time check below.
  }
  if (id !== latestId) {
    redirect("/reception/announcement");
  }

  // Once an announcement's end time has passed it is locked — send the owner
  // back to the list rather than showing an editor that the backend rejects.
  if (announcement.endsAt && new Date(announcement.endsAt) <= new Date()) {
    redirect("/reception/announcement");
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/reception/announcement"
        className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        ← Announcements
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-ink-900">
        Edit announcement
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Changes go live on the website within a few minutes of saving.
      </p>

      <AnnouncementForm
        action={updateAnnouncementAction}
        initial={announcement}
        submitLabel="Save changes"
        pendingText="Saving…"
        formError={searchParams.formError ?? null}
      />
    </div>
  );
}
