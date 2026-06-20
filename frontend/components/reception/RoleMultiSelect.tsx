"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Form field name posted for each selected role. */
  name?: string;
  /** The list of selectable roles. */
  options: readonly string[];
  /** Roles selected initially (e.g. when editing). */
  defaultSelected?: string[];
  label?: string;
  /** Visual style: "light" matches the reception inputs, "muted" the cream cards. */
  id?: string;
}

/**
 * Accessible multi-select dropdown for staff roles. Renders a hidden input
 * per selected value (name defaults to "roles") so the selection posts with a
 * plain server-action <form>. At least one role should be chosen — the server
 * validates this too.
 */
export function RoleMultiSelect({
  name = "roles",
  options,
  defaultSelected = [],
  label = "Roles",
  id = "roles",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Coordinates for the floating panel. It is rendered with `position: fixed`
  // (measured from the trigger button) so it is never clipped by an ancestor
  // with `overflow-hidden` — e.g. the rounded "Active accounts" card that wraps
  // the staff table. `openUp` flips the panel above the trigger when there
  // isn't enough room below.
  const [menu, setMenu] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openUp: boolean;
  } | null>(null);

  function reposition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      352,
      Math.max(160, (openUp ? spaceAbove : spaceBelow))
    );
    setMenu({
      top: openUp ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    });
  }

  useEffect(() => {
    if (!open) return;
    reposition();
    function onScrollOrResize() {
      reposition();
    }
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(role: string) {
    setSelected((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  }

  const summary =
    selected.length === 0
      ? "Select roles…"
      : selected.length <= 2
      ? selected.join(", ")
      : `${selected.length} roles selected`;

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </span>

      {/* Hidden inputs carry the selection into the form submission. */}
      {selected.map((role) => (
        <input key={role} type="hidden" name={name} value={role} />
      ))}

      <button
        type="button"
        id={id}
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-ink-900/15 bg-cream-50 px-3 py-2 text-left text-sm text-ink-900 outline-none focus:border-gold-600"
      >
        <span className={selected.length === 0 ? "text-ink-400" : undefined}>
          {summary}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-ink-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && menu && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: "fixed",
            top: menu.openUp ? undefined : menu.top + 4,
            bottom: menu.openUp
              ? window.innerHeight - menu.top + 4
              : undefined,
            left: menu.left,
            width: menu.width,
            maxHeight: menu.maxHeight,
          }}
          className="z-50 overflow-auto rounded-lg border border-ink-900/15 bg-cream-50 py-1 shadow-soft"
        >
          {options.map((role) => {
            const checked = selected.includes(role);
            return (
              <label
                key={role}
                role="option"
                aria-selected={checked}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-ink-800 hover:bg-cream-100"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(role)}
                  className="h-4 w-4 rounded border-ink-900/30 text-gold-600 focus:ring-gold-600"
                />
                {role}
              </label>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1 rounded-full bg-ink-900/10 px-2 py-0.5 text-[11px] text-ink-700"
            >
              {role}
              <button
                type="button"
                onClick={() => toggle(role)}
                aria-label={`Remove ${role}`}
                className="text-ink-500 hover:text-ink-900"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
