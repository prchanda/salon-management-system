import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/app/reception/roles";
import { api } from "@/lib/api";
import type { Announcement } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Announcement bar — Reception" };

type AnnouncementStatus = {
  label: string;
  dotClass: string;
  textClass: string;
};

/**
 * Is this announcement eligible to be shown publicly right now? (active, its
 * start has arrived, and its end has not passed). Mirrors the backend's public
 * query so the list agrees with what visitors actually see.
 */
function isLiveEligible(a: Announcement, now: Date): boolean {
  if (!a.isActive) return false;
  if (a.startsAt && new Date(a.startsAt) > now) return false;
  if (a.endsAt && new Date(a.endsAt) <= now) return false;
  return true;
}

/**
 * Derives a human-friendly status from the active flag + scheduling window.
 * At most one announcement is Live (the one the public bar shows — passed in
 * as `liveId`). Every other row resolves to Off (manually unchecked or
 * superseded), Scheduled (start in the future), or Ended (end has passed).
 */
function statusOf(a: Announcement, now: Date, liveId: number | null): AnnouncementStatus {
  const starts = a.startsAt ? new Date(a.startsAt) : null;
  const ends = a.endsAt ? new Date(a.endsAt) : null;

  if (!a.isActive) {
    return { label: "Off", dotClass: "bg-ink-400", textClass: "text-ink-500" };
  }
  if (ends && ends <= now) {
    return { label: "Ended", dotClass: "bg-ink-400", textClass: "text-ink-400" };
  }
  if (starts && starts > now) {
    return {
      label: "Scheduled",
      dotClass: "bg-gold-500",
      textClass: "text-gold-600",
    };
  }
  if (a.id === liveId) {
    return { label: "Live", dotClass: "bg-green-600", textClass: "text-green-700" };
  }
  // Active and within its window, but a newer announcement is the live one.
  return { label: "Off", dotClass: "bg-ink-400", textClass: "text-ink-500" };
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatWindow(a: Announcement): string {
  if (!a.startsAt && !a.endsAt) return "Always on";
  const start = a.startsAt ? formatDateTime(a.startsAt) : "Now";
  const end = a.endsAt ? formatDateTime(a.endsAt) : "Until switched off";
  return `${start} → ${end}`;
}

export default async function AnnouncementListPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  let announcements: Announcement[] = [];
  try {
    const result = await api.getAdminAnnouncements();
    announcements = Array.isArray(result) ? result : [];
  } catch {
    announcements = [];
  }

  const now = new Date();
  const saved = searchParams.saved === "1";
  // The single Live announcement = the newest one that is currently eligible to
  // show (active + within its window), matching the public bar's selection.
  let liveId: number | null = null;
  let liveUpdated = -Infinity;
  for (const a of announcements) {
    if (!isLiveEligible(a, now)) continue;
    const u = Date.parse(a.updatedAt);
    if (u > liveUpdated) {
      liveUpdated = u;
      liveId = a.id;
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Announcement bar</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            A slim banner shown across the top of every public page — perfect
            for a flash sale, festival hours, or a holiday notice. Only one
            announcement is live at a time; the others sit as Scheduled, Ended,
            or Off. Every announcement stays editable.
          </p>
        </div>
        <Link
          href="/reception/announcement/new"
          className="btn-primary whitespace-nowrap"
        >
          New announcement
        </Link>
      </div>

      {saved && (
        <p className="mt-6 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved. The banner updates on the website within a few minutes.
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50">
        {announcements.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-500">
            No announcements yet. Click{" "}
            <span className="font-semibold">New announcement</span> to create
            the first one.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {announcements.map((a) => {
                const status = statusOf(a, now, liveId);
                return (
                  <li key={a.id} className="p-4">
                    <Link
                      href={`/reception/announcement/${a.id}/edit`}
                      className="block font-serif text-base text-ink-900 hover:text-gold-600"
                    >
                      <span className="break-words">{a.message}</span>
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest ${status.textClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                        />
                        {status.label}
                      </span>
                      <span className="text-ink-400">{formatWindow(a)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-ink-400">
                        Updated {formatDateTime(a.updatedAt)}
                      </span>
                      <Link
                        href={`/reception/announcement/${a.id}/edit`}
                        className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-cream-100 text-[11px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Message</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">When</th>
                    <th className="px-5 py-3 text-left">Updated</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => {
                    const status = statusOf(a, now, liveId);
                    return (
                      <tr key={a.id} className="border-t border-ink-900/5">
                        <td className="px-5 py-4">
                          <Link
                            href={`/reception/announcement/${a.id}/edit`}
                            className="font-serif text-base text-ink-900 hover:text-gold-600"
                          >
                            {a.message}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${status.textClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                            />
                            {status.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-ink-500">
                          {formatWindow(a)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-ink-500">
                          {formatDateTime(a.updatedAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/reception/announcement/${a.id}/edit`}
                            className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
