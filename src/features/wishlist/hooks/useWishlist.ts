"use client";

import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext";
import type { WishlistContextValue } from "../context/WishlistContext";

/**
 * Access the centralized wishlist state. Must be used inside
 * <WishlistProvider> (mounted once in the root layout, so every storefront
 * page can call it).
 */
export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}