import Link from "next/link";
import { Suspense } from "react";
import { api } from "@/lib/api";
import type { Appointment, TodayAppointments } from "@/lib/types";
import { AssignSpecialistButton } from "@/components/reception/AssignSpecialistButton";
import { AttachCustomerButton } from "@/components/reception/AttachCustomerButton";
import { DateNav } from "@/components/reception/DateNav";
import { FocusHighlighter } from "@/components/reception/FocusHighlighter";
import { MarkDoneButton } from "@/components/reception/MarkDoneButton";
import { getRole, getStaffId, getDisplayName } from "@/app/reception/roles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today — Reception" };

/**
 * Today in the viewer's local timezone as YYYY-MM-DD. We avoid
 * `toISOString()` because it converts to UTC and can drift by a day for
 * users east of UTC (e.g. IST late evenings or early mornings).
 */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Shift a YYYY-MM-DD by N calendar days using UTC arithmetic so the
 * result is unaffected by the local timezone offset.
 */
function shiftDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  return utc.toISOString().slice(0, 10);
}

function fmtTime(t: string): string {
  // "HH:mm:ss" → "10:30 AM"
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function statusBadge(s: string) {
  const tone: Record<string, string> = {
    Booked: "bg-blush-100 text-ink-900",
    Done: "bg-emerald-100 text-emerald-900",
    NoShow: "bg-amber-100 text-amber-900",
    Cancelled: "bg-ink-900/10 text-ink-600",
  };
  return tone[s] ?? "bg-ink-900/10 text-ink-600";
}

/**
 * Returns the id of the next Booked appointment whose time is >= now.
 * Only meaningful when the view is showing today's date.
 */
function findNextUpId(appts: Appointment[]): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = appts
    .filter((a) => a.status === "Booked")
    .map((a) => {
      const [h, m] = a.appointmentTime.split(":").map(Number);
      return { id: a.id, minutes: h * 60 + m };
    })
    .filter((a) => a.minutes >= nowMinutes)
    .sort((a, b) => a.minutes - b.minutes);
  return upcoming[0]?.id ?? null;
}

async function safeGetToday(
  date: string,
  staffId: number | null
): Promise<TodayAppointments> {
  try {
    return await api.getTodayAppointments(date, staffId);
  } catch {
    return { date, appointments: [] };
  }
}

export default async function ReceptionTodayPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const today = todayIso();
  const date = searchParams.date ?? today;
  const isToday = date === today;
  const role = await getRole();
  const staffName = await getDisplayName();

  // Staff see only their own bookings; the owner sees the whole day.
  const filterStaffId = role === "staff" ? await getStaffId() : null;

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <FocusHighlighter />
      </Suspense>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            {role === "staff"
              ? "My bookings"
              : isToday
              ? "Today"
              : "Day view"}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ink-900">
            {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h1>
          {role === "staff" && staffName && (
            <p className="mt-1 text-sm text-ink-500">
              Showing appointments assigned to{" "}
              <span className="font-semibold text-ink-700">{staffName}</span>.
            </p>
          )}
        </div>
        <DateNav
          date={date}
          today={today}
          isToday={isToday}
          prevDate={shiftDate(date, -1)}
          nextDate={shiftDate(date, 1)}
        />
      </div>

      <Suspense key={`${date}-${filterStaffId ?? "all"}`} fallback={<TodaySkeleton />}>
        <TodayContent date={date} isToday={isToday} staffId={filterStaffId} />
      </Suspense>
    </div>
  );
}

async function TodayContent({
  date,
  isToday,
  staffId,
}: {
  date: string;
  isToday: boolean;
  staffId: number | null;
}) {
  const role = await getRole();
  const data = await safeGetToday(date, staffId);
  const appts = data.appointments;

  const byStaff = new Map<string, Appointment[]>();
  for (const a of appts) {
    const key = a.staff?.fullName ?? "Unassigned";
    if (!byStaff.has(key)) byStaff.set(key, []);
    byStaff.get(key)!.push(a);
  }

  const counts = {
    booked: appts.filter((a) => a.status === "Booked").length,
    done: appts.filter((a) => a.status === "Done").length,
    noShow: appts.filter((a) => a.status === "NoShow").length,
    cancelled: appts.filter((a) => a.status === "Cancelled").length,
    walkIns: appts.filter((a) => !a.customerId).length,
  };

  const revenue = appts
    .filter((a) => a.status === "Done")
    .reduce((sum, a) => sum + (a.amountPaid ?? 0), 0);

  const nextUpId = isToday ? findNextUpId(appts) : null;

  return (
    <>
      <p className="-mt-4 text-sm text-ink-600">
        {appts.length} appointment{appts.length === 1 ? "" : "s"} ·{" "}
        ₹{revenue.toLocaleString("en-IN")} collected
      </p>

      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-cream-50 p-4 shadow-soft sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Booked" value={counts.booked} />
        <Stat label="Done" value={counts.done} tone="emerald" />
        <Stat label="No-show" value={counts.noShow} tone="amber" />
        <Stat label="Cancelled" value={counts.cancelled} tone="muted" />
        <Stat label="Walk-ins" value={counts.walkIns} />
        <Stat
          label="Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          tone="gold"
        />
      </dl>

      {appts.length === 0 && (
        <div className="rounded-2xl bg-cream-50 p-10 text-center text-sm text-ink-500">
          No appointments for this day yet.{" "}
          <Link
            href="/reception/new"
            className="font-semibold text-ink-900 hover:text-gold-600"
          >
            Add the first one →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from(byStaff.entries()).map(([staffName, list]) => (
          <section
            key={staffName}
            className="rounded-2xl bg-cream-50 p-6 shadow-soft"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-xl text-ink-900">{staffName}</h2>
              <span className="text-[11px] uppercase tracking-widest text-ink-500">
                {list.length} guest{list.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="mt-5 divide-y divide-ink-900/10">
              {list.map((a) => {
                const isNext = a.id === nextUpId;
                return (
                  <li
                    key={a.id}
                    data-focus-id={`appt-${a.id}`}
                    className={`py-4 ${
                      isNext ? "-mx-2 rounded-xl bg-blush-100/60 px-2" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 shrink-0 font-serif text-lg text-ink-900">
                        {fmtTime(a.appointmentTime)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.customerId && role === "owner" ? (
                            <Link
                              href={`/reception/customers/${a.customerId}`}
                              className="truncate text-sm font-semibold text-ink-900 hover:text-gold-600"
                            >
                              {a.customer?.fullName ?? "Guest"}
                            </Link>
                          ) : a.customerId ? (
                            <span className="truncate text-sm font-semibold text-ink-900">
                              {a.customer?.fullName ?? "Guest"}
                            </span>
                          ) : (
                            <span className="truncate text-sm font-semibold text-ink-900">
                              {a.guestName && a.guestName.trim().toLowerCase() !== "walk-in"
                                ? a.guestName
                                : "Guest"}
                            </span>
                          )}
                          {!a.customerId && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-900">
                              Walk-in
                            </span>
                          )}
                          {!a.staffId && (
                            <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-900">
                              Needs specialist
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${statusBadge(
                              a.status
                            )}`}
                          >
                            {a.status}
                            {a.status === "Done" && a.amountPaid != null
                              ? ` · ₹${a.amountPaid}`
                              : ""}
                          </span>
                          {isNext && (
                            <span className="rounded-full bg-gold-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50">
                              Up next
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-ink-500">
                          {a.service?.serviceName ?? "—"}
                          {a.customer?.phoneNumber ? (
                            <>
                              {" · "}
                              <a
                                href={`tel:${a.customer.phoneNumber}`}
                                className="hover:text-ink-900"
                              >
                                {a.customer.phoneNumber}
                              </a>
                            </>
                          ) : null}
                        </p>
                        {a.remarks && (
                          <p className="mt-1 text-xs italic text-ink-500">
                            “{a.remarks}”
                          </p>
                        )}
                      </div>
                    </div>
                    {(!a.customerId ||
                      (!a.staffId && a.status === "Booked") ||
                      a.status === "Booked") && (
                      <div className="mt-3 flex flex-wrap items-start justify-end gap-2 pl-[4.75rem]">
                        {!a.customerId && (
                          <AttachCustomerButton
                            appointmentId={a.id}
                            defaultName={a.guestName}
                          />
                        )}
                        {!a.staffId && a.status === "Booked" && (
                          <AssignSpecialistButton appointmentId={a.id} />
                        )}
                        {a.status === "Booked" && (
                          <MarkDoneButton
                            appointmentId={a.id}
                            suggestedAmount={a.service?.price ?? 0}
                          />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-8">
      <p className="-mt-4 text-sm text-ink-500">Loading…</p>
      <div className="h-24 animate-pulse rounded-2xl bg-cream-50" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-cream-50" />
        <div className="h-64 animate-pulse rounded-2xl bg-cream-50" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald" | "amber" | "muted" | "gold";
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
      ? "text-amber-700"
      : tone === "muted"
      ? "text-ink-500"
      : tone === "gold"
      ? "text-gold-600"
      : "text-ink-900";
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </dt>
      <dd className={`mt-1 font-serif text-2xl ${valueClass}`}>{value}</dd>
    </div>
  );
}
