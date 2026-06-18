import { redirect } from "next/navigation";
import { getRole } from "@/app/reception/roles";
import { api } from "@/lib/api";
import { SubmitButton } from "@/components/SubmitButton";
import type { Announcement } from "@/lib/types";
import { saveAnnouncementAction } from "./actions";

export const metadata = { title: "Announcement bar — Reception" };

/**
 * UTC ISO instant -> IST wall-clock string for a `datetime-local` input.
 * The salon is in Kolkata (UTC+5:30, no DST).
 */
function utcIsoToIstLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const ist = new Date(ms + 5.5 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(
      ist.getUTCDate()
    )}` + `T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`
  );
}

export default async function AnnouncementPage({
  searchParams,
}: {
  searchParams: { formError?: string; saved?: string };
}) {
  if ((await getRole()) !== "owner") {
    redirect("/reception");
  }

  let announcement: Announcement | null = null;
  try {
    announcement = await api.getAdminAnnouncement();
  } catch {
    announcement = null;
  }

  const formError = searchParams.formError ?? null;
  const saved = searchParams.saved === "1";

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-ink-900">Announcement bar</h1>
      <p className="mt-1 text-sm text-ink-500">
        A slim banner shown across the top of every public page — perfect for a
        flash sale, festival hours, or a holiday notice. Turn it on or off with
        the switch below; it can also hide itself automatically at a set time.
      </p>

      {saved && (
        <p className="mt-6 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved. The banner updates on the website within a few minutes.
        </p>
      )}

      <form
        action={saveAnnouncementAction}
        className="mt-8 space-y-6 rounded-2xl bg-cream-50 p-6 shadow-soft"
      >
        {formError && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError}
          </p>
        )}

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Message
          </span>
          <textarea
            id="message"
            name="message"
            required
            maxLength={200}
            rows={2}
            defaultValue={announcement?.message ?? ""}
            placeholder="✨ Flash Sale — 20% off all hair spa treatments till Sunday."
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          />
          <span className="mt-1 block text-[11px] leading-snug text-ink-400">
            Up to 200 characters. Emojis are welcome to catch the eye.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Colour theme
          </span>
          <select
            id="theme"
            name="theme"
            defaultValue={announcement?.theme ?? "gold"}
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          >
            <option value="gold">Gold (warm highlight)</option>
            <option value="ink">Ink (dark, high contrast)</option>
            <option value="blush">Blush (soft pink)</option>
          </select>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Button label (optional)
            </span>
            <input
              type="text"
              id="ctaLabel"
              name="ctaLabel"
              maxLength={40}
              defaultValue={announcement?.ctaLabel ?? ""}
              placeholder="Book now"
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Button link (optional)
            </span>
            <input
              type="text"
              id="ctaHref"
              name="ctaHref"
              defaultValue={announcement?.ctaHref ?? ""}
              placeholder="/book"
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
        </div>
        <p className="-mt-3 text-[11px] leading-snug text-ink-400">
          Link to a page on your site (e.g. <code>/book</code>,{" "}
          <code>/shop</code>, <code>/services</code>) or a full web address.
          Leave both blank for a text-only banner.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Start time (optional)
            </span>
            <input
              type="datetime-local"
              id="startsAt"
              name="startsAt"
              defaultValue={utcIsoToIstLocalInput(announcement?.startsAt)}
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              End time (optional)
            </span>
            <input
              type="datetime-local"
              id="endsAt"
              name="endsAt"
              defaultValue={utcIsoToIstLocalInput(announcement?.endsAt)}
              className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </label>
        </div>
        <p className="-mt-3 text-[11px] leading-snug text-ink-400">
          Times are in IST. Leave the end time blank to keep the banner up until
          you switch it off. Set an end time and it disappears on its own.
        </p>

        <label className="flex items-start gap-3 rounded-xl bg-cream-100/60 p-4">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={announcement?.isActive ?? false}
            className="mt-0.5 h-4 w-4 rounded border-ink-900/30 text-gold-600 focus:ring-gold-600"
          />
          <span className="text-sm text-ink-700">
            <span className="font-semibold">Show the banner</span> on the public
            website. Untick to hide it instantly.
          </span>
        </label>

        <div className="flex justify-end">
          <SubmitButton pendingText="Saving…" className="btn-primary">
            Save announcement
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
