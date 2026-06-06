"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { SALON, waLink } from "@/lib/salon";

interface Props {
  product: Product;
}

function formatMoney(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export function OrderForm({ product }: Props) {
  const outOfStock =
    product.stockQuantity != null && product.stockQuantity <= 0;
  const maxQty =
    product.stockQuantity != null && product.stockQuantity > 0
      ? Math.min(product.stockQuantity, 20)
      : 20;

  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const total = useMemo(
    () => product.price * Math.max(1, quantity),
    [product.price, quantity]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = customerName.trim();
    const phone = customerPhone.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const email = customerEmail.trim();

    if (!name) return setError("Please enter your name.");
    if (!phone) return setError("Please enter a phone number we can call.");
    if (!/^\d{10}$/.test(phoneDigits))
      return setError("Phone number must be exactly 10 digits.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address.");
    if (quantity < 1) return setError("Quantity must be at least 1.");

    setSubmitting(true);
    try {
      const order = await api.createProductOrder({
        productId: product.id,
        quantity,
        customerName: name,
        customerPhone: phoneDigits,
        customerEmail: email || undefined,
        notes: notes.trim() || undefined,
        website: website || undefined,
      });
      setSuccessId(order.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not place the order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successId !== null) {
    const waMessage = `Hi ${SALON.name}, I've just placed order #${successId} for ${quantity} × ${product.name}. My name is ${customerName.trim()}.`;
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-green-700">
          Order received
        </p>
        <h3 className="mt-3 font-serif text-2xl text-ink-900">
          Thank you, {customerName.trim()}!
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          Your order <span className="font-semibold">#{successId}</span> for{" "}
          <span className="font-semibold">
            {quantity} × {product.name}
          </span>{" "}
          is in. We&apos;ll call{" "}
          <span className="font-mono">{customerPhone.trim()}</span> shortly to
          confirm payment. Pick it up from the salon at your convenience.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            Message us on WhatsApp
          </a>
          <Link href="/shop" className="btn-outline">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {outOfStock ? (
        <div className="rounded-xl border border-ink-900/10 bg-cream-100 px-4 py-3 text-sm text-ink-600">
          This product is currently out of stock. Drop us a message — we may
          restock soon.
          <div className="mt-3">
            <a
              href={waLink(`Hi, do you have ${product.name} back in stock?`)}
              target="_blank"
              rel="noreferrer"
              className="btn-outline inline-flex"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
              Quantity
            </label>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-full border border-ink-900/10 bg-cream-50 text-lg leading-none text-ink-700 hover:border-gold-600 hover:text-gold-600"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v))
                    setQuantity(
                      Math.max(1, Math.min(maxQty, Math.floor(v)))
                    );
                }}
                className="w-20 rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2 text-center font-serif text-lg focus:border-gold-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(maxQty, q + 1))
                }
                className="h-10 w-10 rounded-full border border-ink-900/10 bg-cream-50 text-lg leading-none text-ink-700 hover:border-gold-600 hover:text-gold-600"
                aria-label="Increase quantity"
              >
                +
              </button>
              {product.stockQuantity != null && (
                <span className="text-[11px] uppercase tracking-widest text-ink-400">
                  {product.stockQuantity} in stock
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
                Your name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                maxLength={120}
                placeholder="Riya Sharma"
                className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
                Phone (10 digits) *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  // Strip everything that isn't a digit and cap at 10.
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setCustomerPhone(digits);
                }}
                required
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="\d{10}"
                maxLength={10}
                title="Enter a 10-digit phone number (digits only)."
                placeholder="9876543210"
                className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
              Email{" "}
              <span className="font-normal lowercase text-ink-400">
                (optional)
              </span>
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="riya@example.com"
              className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-ink-900/10 bg-cream-100/60 px-4 py-3 text-xs leading-relaxed text-ink-600">
            <span className="font-semibold uppercase tracking-widest text-ink-700">
              Pickup at salon
            </span>{" "}
            — once we confirm your order on the phone, drop by at your
            convenience to pay and collect.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
              Notes{" "}
              <span className="font-normal lowercase text-ink-400">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Anything we should know?"
              className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-gold-600 focus:outline-none"
            />
          </div>

          {/* Honeypot — hidden from users, only bots will fill it. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="rounded-xl bg-cream-100 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs uppercase tracking-widest text-ink-500">
                Order total
              </span>
              <span className="font-serif text-2xl text-gold-600">
                ₹{formatMoney(total)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-500">
              {quantity} × ₹{formatMoney(product.price)} — paid on
              pickup/delivery.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-progress disabled:opacity-70"
          >
            {submitting && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="3"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <span>
              {submitting ? "Placing order…" : "Place order"}
            </span>
          </button>

          <p className="text-center text-[11px] uppercase tracking-widest text-ink-400">
            No payment now — we&apos;ll confirm by phone first.
          </p>
        </>
      )}
    </form>
  );
}
