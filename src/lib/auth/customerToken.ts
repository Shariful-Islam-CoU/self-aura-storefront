/**
 * Customer session helpers for client-side namespacing.
 *
 * The storefront keeps the customer JWT in localStorage (`customer_token`).
 * Its `sub`/`id` claim (the backend's `signCustomerToken`) is used here ONLY
 * to name a local storage namespace - the per-account cart.
 *
 * The signature is deliberately NOT verified in the browser: the backend
 * authorizes every request, so a tampered token could at worst select the
 * wrong LOCAL namespace - it can never read another account's data.
 */

/** localStorage key holding the signed-in customer's JWT. */
export const CUSTOMER_TOKEN_KEY = "customer_token";

/** Customer ids are Mongo ObjectIds - the format the backend signs. */
const CUSTOMER_ID_PATTERN = /^[a-f0-9]{24}$/i;

/**
 * Reads the customer id from a customer JWT without verifying it.
 * Returns null for a missing/malformed/foreign token (guest).
 */
export function getCustomerIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;

  const segment = token.split(".")[1];
  if (!segment) return null;

  try {
    // JWT payloads are base64url: restore the standard alphabet + padding so
    // `atob` accepts them in every browser.
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload: unknown = JSON.parse(atob(padded));
    if (!payload || typeof payload !== "object") return null;

    const claims = payload as { sub?: unknown; id?: unknown };
    const candidate = claims.sub ?? claims.id;
    if (typeof candidate !== "string" || !CUSTOMER_ID_PATTERN.test(candidate)) return null;

    return candidate.toLowerCase();
  } catch {
    return null;
  }
}

/** The signed-in customer id from the stored session, or null for a guest. */
export function getActiveCustomerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return getCustomerIdFromToken(window.localStorage.getItem(CUSTOMER_TOKEN_KEY));
  } catch {
    // Storage unavailable (private mode / disabled) - behave as a guest.
    return null;
  }
}
