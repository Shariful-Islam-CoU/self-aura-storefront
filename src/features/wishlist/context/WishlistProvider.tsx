"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { loadWishlistIds, saveWishlistIds } from "../services/wishlistStorage";
import { WishlistContext } from "./WishlistContext";
import type { WishlistContextValue } from "./WishlistContext";
import type { WishlistState } from "../types";

export type WishlistAction =
  | { type: "hydrate"; productIds: string[] }
  | { type: "add"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "toggle"; productId: string }
  | { type: "clear" };

/** Pure state transitions - exported so the wishlist rules are testable. */
export function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "hydrate":
      return { productIds: action.productIds, hydrated: true };
    case "add":
      // Never add duplicates - a product is either saved or it isn't.
      if (state.productIds.includes(action.productId)) return state;
      return { ...state, productIds: [...state.productIds, action.productId] };
    case "remove":
      return {
        ...state,
        productIds: state.productIds.filter((id) => id !== action.productId),
      };
    case "toggle":
      return state.productIds.includes(action.productId)
        ? { ...state, productIds: state.productIds.filter((id) => id !== action.productId) }
        : { ...state, productIds: [...state.productIds, action.productId] };
    case "clear":
      return { ...state, productIds: [] };
  }
}

/**
 * Centralized wishlist state for the whole storefront (Context + reducer),
 * mounted once in the root layout.
 *
 * - Local-only today: the backend has no wishlist/favorite API (verified), so
 *   saved product ids live in the browser and survive refreshes/restarts via
 *   localStorage. When the backend gains a wishlist API, this provider is the
 *   single place that gains the sync/migration layer - no product surface
 *   changes.
 * - Hydrates from localStorage once on the client (never during SSR, so no
 *   hydration mismatch - the initial render is always an empty wishlist).
 * - Persists every change back to localStorage after hydration only (a reload
 *   never clears a wishlist that was just loaded).
 * - Stores only product ids - never product data, prices or credentials.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, {
    productIds: [],
    hydrated: false,
  } satisfies WishlistState);

  // Client-only hydration from the persisted wishlist.
  useEffect(() => {
    dispatch({ type: "hydrate", productIds: loadWishlistIds() ?? [] });
  }, []);

  // Keep localStorage in sync with every change (only after hydration).
  useEffect(() => {
    if (state.hydrated) saveWishlistIds(state.productIds);
  }, [state.hydrated, state.productIds]);

  const addToWishlist = useCallback((productId: string) => {
    dispatch({ type: "add", productId });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    dispatch({ type: "remove", productId });
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    dispatch({ type: "toggle", productId });
  }, []);

  const clearWishlist = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      productIds: state.productIds,
      hydrated: state.hydrated,
      wishlistCount: state.productIds.length,
      isInWishlist: (productId) => state.productIds.includes(productId),
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [state, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}