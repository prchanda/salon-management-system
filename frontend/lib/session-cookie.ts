// HMAC signing for session cookies. Used to make the reception role/staff-id
// cookies tamper-evident: a user can no longer edit `reception_auth` in devtools
// to escalate from "staff" to "owner", because they cannot forge the signature.
//
// Implemented with the Web Crypto API (globalThis.crypto.subtle) so the exact
// same code runs in the Edge middleware and in Node server components / route
// handlers. All functions are async because Web Crypto is async.

const SECRET_ENV = "RECEPTION_COOKIE_SECRET";
const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time string comparison to avoid leaking the signature via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Returns `${value}.${signature}`. Throws if the secret is not configured so a
 * misconfiguration fails loudly at login rather than silently issuing
 * unverifiable cookies.
 */
export async function signValue(value: string): Promise<string> {
  const secret = process.env[SECRET_ENV];
  if (!secret) {
    throw new Error(`${SECRET_ENV} is not set; cannot sign session cookie.`);
  }
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return `${value}.${toBase64Url(sig)}`;
}

/**
 * Verifies a `${value}.${signature}` cookie and returns the original value, or
 * null if the cookie is missing, malformed, unsigned, or the signature is
 * invalid (including when the secret is unset — fail closed).
 */
export async function verifyValue(
  signed: string | undefined | null
): Promise<string | null> {
  if (!signed) return null;
  const secret = process.env[SECRET_ENV];
  if (!secret) return null;

  const dot = signed.lastIndexOf(".");
  if (dot <= 0 || dot === signed.length - 1) return null;

  const value = signed.slice(0, dot);
  const providedSig = signed.slice(dot + 1);

  const key = await importKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const expectedSig = toBase64Url(expected);

  return timingSafeEqual(providedSig, expectedSig) ? value : null;
}
