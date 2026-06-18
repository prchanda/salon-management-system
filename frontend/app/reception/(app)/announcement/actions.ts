"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import type { AnnouncementTheme, UpdateAnnouncementPayload } from "@/lib/types";

const THEMES: AnnouncementTheme[] = ["gold", "ink", "blush"];

async function assertOwner() {
  if ((await getRole()) !== "owner") {
    redirect("/reception/login");
  }
}

/**
 * A `datetime-local` value carries no timezone. The salon is in Kolkata
 * (IST, UTC+5:30, no DST), so the owner enters wall-clock IST — we tag it with
 * +05:30 and store the equivalent UTC instant the backend expects.
 */
function istLocalToUtcIso(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const ms = Date.parse(`${v}:00+05:30`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

type ParseResult =
  | { ok: true; payload: UpdateAnnouncementPayload }
  | { ok: false; error: string };

/** Reads and validates the shared announcement form fields. */
function parseForm(formData: FormData): ParseResult {
  const message = String(formData.get("message") ?? "").trim();
  const themeRaw = String(formData.get("theme") ?? "gold")
    .trim()
    .toLowerCase();
  const theme = (
    THEMES.includes(themeRaw as AnnouncementTheme) ? themeRaw : "gold"
  ) as AnnouncementTheme;
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const isActive = formData.get("isActive") != null;
  const startsAt = istLocalToUtcIso(String(formData.get("startsAt") ?? ""));
  const endsAt = istLocalToUtcIso(String(formData.get("endsAt") ?? ""));

  if (message.length < 1 || message.length > 200) {
    return { ok: false, error: "Message must be 1–200 characters." };
  }
  if (ctaLabel.length > 40) {
    return { ok: false, error: "Button label must be 40 characters or fewer." };
  }
  if ((ctaLabel.length > 0) !== (ctaHref.length > 0)) {
    return {
      ok: false,
      error: "Provide both a button label and link, or leave both blank.",
    };
  }
  if (
    ctaHref.length > 0 &&
    !(ctaHref.startsWith("/") || /^https?:\/\//i.test(ctaHref))
  ) {
    return {
      ok: false,
      error: "Button link must start with / or http:// or https://.",
    };
  }
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return { ok: false, error: "The end time must be after the start time." };
  }

  return {
    ok: true,
    payload: {
      message,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      theme,
      isActive,
      startsAt,
      endsAt,
    },
  };
}

export async function createAnnouncementAction(formData: FormData) {
  await assertOwner();

  const errorPath = (reason: string) =>
    `/reception/announcement/new?formError=${encodeURIComponent(reason)}`;

  const parsed = parseForm(formData);
  if (!parsed.ok) {
    redirect(errorPath(parsed.error));
  }

  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  let failed = false;
  try {
    await api.createAnnouncement(parsed.payload);
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(errorPath("Could not create the announcement. Please try again."));
  }

  // Bust the cached public pages so the bar appears for visitors.
  revalidatePath("/", "layout");
  revalidatePath("/reception/announcement");

  redirect("/reception/announcement?saved=1");
}

export async function updateAnnouncementAction(formData: FormData) {
  await assertOwner();

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/reception/announcement");
  }

  const errorPath = (reason: string) =>
    `/reception/announcement/${id}/edit?formError=${encodeURIComponent(reason)}`;

  const parsed = parseForm(formData);
  if (!parsed.ok) {
    redirect(errorPath(parsed.error));
  }

  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  let failed = false;
  try {
    await api.updateAnnouncement(id, parsed.payload);
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(errorPath("Could not save the announcement. Please try again."));
  }

  // Bust the cached public pages so the bar updates for visitors.
  revalidatePath("/", "layout");
  revalidatePath("/reception/announcement");

  redirect("/reception/announcement?saved=1");
}
