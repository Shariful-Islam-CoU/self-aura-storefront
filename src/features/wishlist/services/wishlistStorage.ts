import type { PersistedWishlist } from "../types";

/**
 * Wishlist persistence — localStorage wrapper.
 *
 * Rules that keep this safe (same discipline as the cart storage):
 *   - never touched during server rendering (`typeof window` guard)
 *   - every read is validated entry-by-entry; malformed data is dropped
 *     instead of crashing the app
 *   - localStorage is never trusted: only non-empty string ids are kept,
 *     duplicates are removed, and the list is capped
 *   - storage failures (privacy mode, quota, disabled storage) are swallowed —
 *     the wishlist still works for the session
 *
 * The stored shape is exactly `{ productIds: string[] }` — product references
 * only, never product data, prices, or credentials.
 */

export const WISHLIST_STORAGE_KEY = "self_aura.wishlist.v1";

/** Safety cap - a wishlist is small; this guards against runaway storage. */
const MAX_WISHLIST_IDS = 200;

/** Read + validate the persisted wishlist ids. Returns null when absent/unreadable. */
export function loadWishlistIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validateWishlistIds(parsed);
  } catch {
    return null;
  }
}

/** Persist the wishlist ids (removes the key when empty). Failures are ignored. */
export function saveWishlistIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) {
      window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
      return;
    }
    const payload: PersistedWishlist = { productIds: ids };
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (private mode / quota) - keep session wishlist only.
  }
}

function validateWishlistIds(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return [];
  const ids = (value as Record<string, unknown>).productIds;
  if (!Array.isArray(ids)) return [];
  const result: string[] = [];
  for (const entry of ids) {
    if (typeof entry !== "string" || entry.length === 0) continue;
    if (!result.includes(entry)) result.push(entry);
    if (result.length >= MAX_WISHLIST_IDS) break;
  }
  return result;
}