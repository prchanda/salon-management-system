"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  NotificationEvent,
  NotificationFeed,
  NotificationKind,
} from "@/lib/types";

const POLL_INTERVAL_MS = 20_000;
const MAX_KEPT = 50;
const SEEN_KEY = "reception:notifications:lastSeen";
const MUTED_KEY = "reception:notifications:muted";

interface Toast extends NotificationEvent {
  toastId: number;
}

interface NotificationsContextValue {
  events: NotificationEvent[];
  unreadCount: number;
  muted: boolean;
  toggleMuted: () => void;
  markAllSeen: () => void;
  toasts: Toast[];
  dismissToast: (toastId: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}

/**
 * Owns the single notification poller for the whole reception app. Mounted
 * once (in the shell) so there is exactly one polling loop regardless of how
 * many bells consume the context. Surfaces an unread count, a recent-events
 * list, attention toasts and a short chime for genuinely new events.
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [muted, setMuted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cursor for the next poll (the backend's server time from the last call).
  const cursorRef = useRef<string | null>(null);
  // Ids we've already alerted on (toast + chime) — prevents re-alerting the
  // same event across polls and avoids blasting the initial backlog.
  const alertedRef = useRef<Set<string>>(new Set());
  // True until the first fetch settles, so the initial backlog is silent.
  const primedRef = useRef(false);
  const toastSeq = useRef(0);

  // ── Restore persisted preferences ───────────────────────────────────
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (seen) setLastSeen(Number(seen) || 0);
      setMuted(window.localStorage.getItem(MUTED_KEY) === "1");
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  }, []);

  const playChime = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      // Two quick rising tones — a soft, recognisable "ding-dong".
      const tones = [
        { f: 880, t: now },
        { f: 1175, t: now + 0.13 },
      ];
      for (const { f, t } of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
      }
      // Free the context shortly after the sound finishes.
      window.setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch {
      /* autoplay blocked or no audio device — ignore */
    }
  }, []);

  const pushToast = useCallback((event: NotificationEvent) => {
    const toastId = ++toastSeq.current;
    setToasts((prev) => [{ ...event, toastId }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 7000);
  }, []);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  // ── Poll the scoped feed ────────────────────────────────────────────
  const poll = useCallback(async () => {
    const params = new URLSearchParams();
    if (cursorRef.current) params.set("since", cursorRef.current);
    try {
      const res = await fetch(`/bff/notifications?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationFeed;
      cursorRef.current = data.serverTime ?? cursorRef.current;
      const incoming = data.events ?? [];

      if (incoming.length > 0) {
        setEvents((prev) => {
          const byId = new Map(prev.map((e) => [e.id, e]));
          for (const e of incoming) byId.set(e.id, e);
          return Array.from(byId.values())
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, MAX_KEPT);
        });
      }

      // Alert only on events we haven't alerted on yet. The very first poll
      // primes the set silently so we don't replay history.
      const fresh = incoming.filter((e) => !alertedRef.current.has(e.id));
      for (const e of fresh) alertedRef.current.add(e.id);

      if (primedRef.current && fresh.length > 0) {
        // Newest first, but show oldest-on-top so the latest sits at the front.
        for (const e of [...fresh].reverse()) pushToast(e);
        if (!muted) playChime();
      }
      primedRef.current = true;
    } catch {
      /* transient network error — try again next tick */
    }
  }, [muted, playChime, pushToast]);

  // Interval + poll on focus/visibility so reception sees things promptly.
  useEffect(() => {
    poll();
    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    const onFocus = () => poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  const unreadCount = useMemo(
    () => events.filter((e) => new Date(e.createdAt).getTime() > lastSeen).length,
    [events, lastSeen]
  );

  const markAllSeen = useCallback(() => {
    const newest = events.reduce(
      (max, e) => Math.max(max, new Date(e.createdAt).getTime()),
      lastSeen
    );
    const stamp = Math.max(newest, Date.now() - 1);
    setLastSeen(stamp);
    try {
      window.localStorage.setItem(SEEN_KEY, String(stamp));
    } catch {
      /* ignore */
    }
  }, [events, lastSeen]);

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      events,
      unreadCount,
      muted,
      toggleMuted,
      markAllSeen,
      toasts,
      dismissToast,
    }),
    [events, unreadCount, muted, toggleMuted, markAllSeen, toasts, dismissToast]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </NotificationsContext.Provider>
  );
}

// ── Toasts ─────────────────────────────────────────────────────────────
function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (toastId: number) => void;
}) {
  const router = useRouter();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[80] flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.toastId}
          type="button"
          onClick={() => {
            onDismiss(t.toastId);
            router.push(t.href);
          }}
          className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-gold-600/30 bg-cream-50 px-3.5 py-3 text-left shadow-lg ring-1 ring-ink-900/5 transition hover:border-gold-600/60 animate-[notifIn_0.25s_ease-out]"
        >
          <KindIcon kind={t.kind} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink-900">
              {t.title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-600">
              {t.subtitle}
            </span>
          </span>
          <span
            role="button"
            tabIndex={-1}
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(t.toastId);
            }}
            className="-mr-1 -mt-0.5 shrink-0 rounded p-1 text-ink-400 hover:text-ink-900"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </span>
        </button>
      ))}
      <style>{`@keyframes notifIn{from{opacity:0;transform:translateX(0.75rem)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

// ── Bell + dropdown ────────────────────────────────────────────────────
export function NotificationBell({
  className,
  align = "right",
}: {
  className?: string;
  /**
   * Which edge the dropdown anchors to. Use "right" for a bell near the
   * right edge (mobile top bar) so the panel opens leftward; use "left" for
   * the bell in the narrow desktop sidebar so the panel opens rightward into
   * the content area instead of off the left edge of the screen.
   */
  align?: "left" | "right";
}) {
  const { events, unreadCount, muted, toggleMuted, markAllSeen } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) markAllSeen();
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-cream-100 hover:text-ink-900"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[1.05rem] text-white ring-2 ring-cream-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-[70] mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ink-900/10 bg-cream-50 shadow-2xl ${align === "left" ? "left-0" : "right-0"}`}>
          <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
              Notifications
            </p>
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Sound off" : "Sound on"}
              className="rounded p-1 text-ink-400 hover:text-ink-900"
            >
              {muted ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                </svg>
              )}
            </button>
          </div>

          <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
            {events.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-ink-900/5">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition hover:bg-cream-100"
                    >
                      <KindIcon kind={e.kind} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink-900">
                          {e.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-600">
                          {e.subtitle}
                        </span>
                        <span className="mt-1 block text-[10px] uppercase tracking-widest text-ink-400">
                          {relativeTime(e.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function KindIcon({ kind }: { kind: NotificationKind }) {
  const map: Record<
    NotificationKind,
    { bg: string; fg: string; path: React.ReactNode }
  > = {
    booking: {
      bg: "bg-gold-600/15",
      fg: "text-gold-700",
      path: (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </>
      ),
    },
    order: {
      bg: "bg-emerald-600/15",
      fg: "text-emerald-700",
      path: (
        <>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
        </>
      ),
    },
    review: {
      bg: "bg-amber-500/15",
      fg: "text-amber-600",
      path: (
        <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
      ),
    },
    signup: {
      bg: "bg-sky-600/15",
      fg: "text-sky-700",
      path: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </>
      ),
    },
  };
  const v = map[kind];
  return (
    <span
      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${v.bg} ${v.fg}`}
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        {v.path}
      </svg>
    </span>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
