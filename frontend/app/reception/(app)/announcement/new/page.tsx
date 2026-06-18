import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/app/reception/roles";
import { AnnouncementForm } from "../AnnouncementForm";
import { createAnnouncementAction } from "../actions";

export const metadata = { title: "New announcement — Reception" };

export default async function NewAnnouncementPage({
  searchParams,
}: {
  searchParams: { formError?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/reception/announcement"
        className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        ← Announcements
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-ink-900">New announcement</h1>
      <p className="mt-1 text-sm text-ink-500">
        This becomes the live banner across the top of every public page. Saving
        it returns you to the list.
      </p>

      <AnnouncementForm
        action={createAnnouncementAction}
        submitLabel="Create announcement"
        pendingText="Creating…"
        formError={searchParams.formError ?? null}
      />
    </div>
  );
}
