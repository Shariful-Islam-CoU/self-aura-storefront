import type { AddToCartItem, AddToCartResult } from "../types";

/**
 * Cart action seam - validates an add-to-cart request before it reaches the
 * centralized cart state.
 *
 * Availability (stock) validation happens earlier in `useAddToCart` against
 * the product's real data; this service guards the payload shape. The future
 * Cart/Checkout API will extend this seam without touching the product page.
 */
export const cartService = {
  async addItem(item: AddToCartItem): Promise<AddToCartResult> {
    if (!item.productId) {
      return { ok: false, error: "unknown" };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, error: "invalid-quantity" };
    }
    return { ok: true };
  },
};