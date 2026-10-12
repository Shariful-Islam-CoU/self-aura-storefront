/**
 * Cart feature types.
 *
 * The cart is a client-side, centralized state (Context + reducer) plus safe
 * localStorage persistence. It is NOT authoritative — the backend validates
 * product availability, price, stock and totals during the future checkout/
 * order flow.
 *
 * Line items persist a customer-safe SNAPSHOT of the product (only the fields
 * needed to render the cart without refetching the catalogue):
 *
 *   CartItem                     - one cart line (key = product id for now,
 *                                  variant id joins later)
 *   CartProductSnapshot          - minimal customer-safe product fields
 *   AddToCartItem / Result       - the add-action contract (details page)
 */

/** Minimal customer-safe product snapshot stored on a cart line. */
export interface CartProductSnapshot {
  id: string;
  slug: string;
  name: string;
  sellingPrice: number;
  /** First product image (url + alt). Optional - some products have none. */
  image?: { url: string; alt: string };
  stock: number;
  /** Backend-derived urgency flag (the reorder threshold is never public). */
  lowStock: boolean;
}

/** One cart line. `key` uniquely identifies the line (product id today). */
export interface CartItem {
  key: string;
  product: CartProductSnapshot;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  /** True once persisted data has been read (client-side, post-mount). */
  hydrated: boolean;
}

export interface AddToCartItem {
  productId: string;
  /** Populated once variant selection exists (the backend supports variants). */
  variantId?: string;
  quantity: number;
}

export type AddToCartErrorCode = "out-of-stock" | "invalid-quantity" | "unknown";

export interface AddToCartResult {
  ok: boolean;
  error?: AddToCartErrorCode;
}

export type AddToCartStatus = "idle" | "adding" | "added" | "error";