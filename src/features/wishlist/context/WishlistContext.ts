"use client";

import { createContext } from "react";

/**
 * The wishlist context contract. Exposed via `useWishlist()` - components
 * never touch the state store directly, so wishlist state stays centralized
 * and every surface (header count, product cards, product details, wishlist
 * page) stays in sync.
 */
export interface WishlistContextValue {
  /** Saved product ids (backend ObjectIds) in the order they were added. */
  productIds: string[];
  /** False until persisted ids have been hydrated (client-only). */
  hydrated: boolean;
  /** Number of saved products. */
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  /** Add when absent, remove when present. */
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);