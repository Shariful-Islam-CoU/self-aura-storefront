import type { CartItem } from "../types";

/**
 * Cart persistence - localStorage wrapper.
 *
 * Rules that keep this safe:
 *   - never touched during server rendering (`typeof window` guard)
 *   - every read is validated entry-by-entry; malformed data is dropped
 *     instead of crashing the app
 *   - localStorage is never trusted: length, types and value ranges are
 *     re-checked on load
 *   - storage failures (privacy mode, quota, disabled storage) are swallowed -
 *     the cart still works for the session
 *
 * No payment/credential data is ever stored here.
 */

export const CART_STORAGE_KEY = "self_aura.cart.v1";

/** Read + validate the persisted cart. Returns null when absent/unreadable. */
export function loadCart(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validateCartItems(parsed);
  } catch {
    return null;
  }
}

/** Persist the cart (removes the key when empty). Failures are ignored. */
export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode / quota) - keep session cart only.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseImage(value: unknown): { url: string; alt: string } | undefined {
  if (!isRecord(value) || typeof value.url !== "string" || value.url.length === 0) {
    return undefined;
  }
  return { url: value.url, alt: typeof value.alt === "string" ? value.alt : "" };
}

function validateCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  for (const entry of value) {
    const item = validateCartItem(entry);
    if (item) items.push(item);
  }
  return items;
}

function validateCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;

  const product = value.product;
  if (!isRecord(product)) return null;

  const key = value.key;
  const productId = product.id;
  if (typeof key !== "string" || key.length === 0) return null;
  if (typeof productId !== "string" || productId.length === 0) return null;
  // The line key must identify the same product - never trust drift.
  if (key !== productId) return null;

  if (typeof product.name !== "string" || product.name.length === 0) return null;
  if (typeof product.slug !== "string" || product.slug.length === 0) return null;
  if (
    typeof product.sellingPrice !== "number" ||
    !Number.isFinite(product.sellingPrice) ||
    product.sellingPrice < 0
  ) {
    return null;
  }

  const stock =
    typeof product.stock === "number" && Number.isFinite(product.stock)
      ? Math.max(0, Math.floor(product.stock))
      : 0;
  const lowStock = product.lowStock === true;

  const quantity =
    typeof value.quantity === "number" && Number.isFinite(value.quantity)
      ? Math.floor(value.quantity)
      : 0;
  if (quantity < 1) return null;
  // Never let a stale/tampered entry exceed the snapshot stock.
  const clampedQuantity = stock > 0 ? Math.min(quantity, stock) : quantity;
  if (clampedQuantity < 1) return null;

  return {
    key,
    quantity: clampedQuantity,
    product: {
      id: productId,
      slug: product.slug,
      name: product.name,
      sellingPrice: product.sellingPrice,
      image: parseImage(product.image),
      stock,
      lowStock,
    },
  };
}