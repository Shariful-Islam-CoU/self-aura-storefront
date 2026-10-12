/**
 * Wishlist feature types.
 *
 * The backend has no wishlist/favorite API (verified: no wishlist routes or
 * models exist in self_aura_backend), so the wishlist is a client-side,
 * centralized state (Context + localStorage). It stores ONLY product ids —
 * never full product objects, prices or customer data. The wishlist page
 * fetches the current product info from the real catalogue when rendering, so
 * a price/availability change is always reflected and never trusted from
 * storage.
 */

import type { Product } from "@/types";

export interface WishlistState {
  productIds: string[];
  /** True once persisted ids have been read (client-side, post-mount). */
  hydrated: boolean;
}

/**
 * The persisted (localStorage) shape — product references only. `hydrated` is
 * a runtime concern and is deliberately never written to storage.
 */
export interface PersistedWishlist {
  productIds: string[];
}

/**
 * Result of fetching a single wishlist product from the catalogue.
 *
 * `loaded` carries the CURRENT product; `missing` means the backend could not
 * return it. `notFound` distinguishes a genuinely deleted product (backend
 * 404) from a transient API failure (network/auth/5xx) so the page can tell
 * "this item is gone" apart from "the catalogue is unreachable".
 */
export type WishlistProductResult =
  | { id: string; status: "loaded"; product: Product }
  | { id: string; status: "missing"; notFound: boolean };

/** Page-level states for the wishlist view ("loading" is derived, not stored). */
export type WishlistViewStatus = "idle" | "ready" | "error";