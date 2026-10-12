import type { Product } from "@/types";
import { getPrimaryImage } from "@/features/products/lib/media";
import type { CartItem, CartState } from "../types";

/**
 * Cart reducer - pure state transitions, no side effects.
 *
 * Availability rules (mirror the storefront product surfaces):
 *   - a line is only added for an in-stock product
 *   - quantity is clamped to the snapshot stock when stock is known
 *   - quantity never drops below 1 (removal is an explicit action)
 *   - adding the same product again MERGES into the existing line (no
 *     duplicate cart lines)
 *
 * The snapshot is advisory only: the backend re-validates availability, price
 * and stock when the order is created.
 */
export type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "set-quantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

function maxQuantityFor(item: CartItem): number {
  return item.product.stock > 0 ? item.product.stock : Number.POSITIVE_INFINITY;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };

    case "add": {
      const { item } = action;
      // Never add an unavailable line, even if a caller bypassed the guards.
      if (item.product.stock <= 0) return state;
      if (item.quantity < 1) return state;

      const max = maxQuantityFor(item);
      const existing = state.items.find((entry) => entry.key === item.key);

      if (!existing) {
        return {
          ...state,
          items: [...state.items, { ...item, quantity: Math.min(item.quantity, max) }],
        };
      }

      // Merge: same product -> increase quantity (capped at stock).
      const mergedQuantity = Math.min(existing.quantity + item.quantity, max);
      return {
        ...state,
        items: state.items.map((entry) =>
          entry.key === item.key ? { ...entry, quantity: mergedQuantity } : entry
        ),
      };
    }

    case "set-quantity": {
      const next = Math.max(1, Math.floor(action.quantity));
      return {
        ...state,
        items: state.items.map((entry) =>
          entry.key === action.key
            ? { ...entry, quantity: Math.min(next, maxQuantityFor(entry)) }
            : entry
        ),
      };
    }

    case "remove":
      return { ...state, items: state.items.filter((entry) => entry.key !== action.key) };

    case "clear":
      return { ...state, items: [] };

    default:
      return state;
  }
}

/** Build a customer-safe cart line from a storefront product. */
export function buildCartItem(product: Product, quantity: number): CartItem | null {
  if (!product) return null;
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  // Shop surfaces already gate on availability, but never trust the caller.
  if (product.stock <= 0) return null;

  // Only the primary image is carried into the cart: a line item needs one
  // thumbnail, and copying the whole list into localStorage would bloat every
  // saved cart for no visible benefit.
  const primary = getPrimaryImage(product.images);
  const image = primary ? { url: primary.url, alt: primary.alt } : undefined;

  return {
    key: product.id,
    quantity,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sellingPrice: product.sellingPrice,
      image,
      stock: product.stock,
      lowStock: product.lowStock,
    },
  };
}

/** Total quantities across all lines (header badge, "Cart (N)"). */
export function cartItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/** Sum of line subtotals (product price × quantity). */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.product.sellingPrice * item.quantity, 0);
}

/** True when any line references an unavailable product. */
export function cartHasUnavailable(items: CartItem[]): boolean {
  return items.some((item) => item.product.stock <= 0);
}