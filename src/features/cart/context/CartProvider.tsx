"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { CUSTOMER_TOKEN_KEY, getActiveCustomerId } from "@/lib/auth/customerToken";
import { cartStorageKeyFor, loadCart, saveCart } from "../services/cartStorage";
import {
  buildCartItem,
  cartHasUnavailable,
  cartItemCount,
  cartReducer,
  cartSubtotal,
} from "./cartReducer";
import type { CartReducerState } from "./cartReducer";
import { CartContext } from "./CartContext";
import type { CartContextValue } from "./CartContext";

/**
 * Centralized cart state for the whole storefront (Context + reducer).
 *
 * The cart is namespaced per identity: guests have one cart, and every
 * signed-in customer has their own, so two accounts on the same browser never
 * see each other's items (and the guest cart stays intact across logins).
 *
 * - Hydrates from localStorage once, on the client (never during SSR, so no
 *   hydration mismatch - the initial render is always an empty cart).
 * - Re-hydrates when the signed-in identity changes (e.g. signing in from the
 *   checkout modal, which does not navigate or reload).
 * - Persists every change back to the ACTIVE namespace only, after hydration.
 * - Guards against unusable input (unavailable products are never added).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
    storageKey: null,
  } satisfies CartReducerState);

  // The resolved namespace of the hydrated cart. Read synchronously by the
  // storage listener and used to skip no-op re-syncs.
  const activeKeyRef = useRef<string | null>(null);

  /**
   * Resolves the cart owner from the stored session and hydrates that
   * namespace. The token is read directly (not derived from `isLoggedIn`) so
   * the very first hydration is already the correct cart; the auth flag only
   * acts as a change trigger.
   */
  const syncCart = useCallback(() => {
    const storageKey = cartStorageKeyFor(getActiveCustomerId());
    if (activeKeyRef.current === storageKey) return;
    activeKeyRef.current = storageKey;
    dispatch({ type: "hydrate", items: loadCart(storageKey) ?? [], storageKey });
  }, []);

  // Initial hydration + re-sync whenever the signed-in state flips.
  useEffect(() => {
    syncCart();
  }, [syncCart, isLoggedIn]);

  // Follow identity changes and cart edits made in other tabs.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      // A full clear() wipes the token too: resolve from scratch.
      if (event.key === null) {
        activeKeyRef.current = null;
        syncCart();
        return;
      }
      if (event.key === CUSTOMER_TOKEN_KEY) {
        syncCart();
        return;
      }
      const storageKey = activeKeyRef.current;
      if (storageKey && event.key === storageKey) {
        dispatch({
          type: "hydrate",
          items: loadCart(storageKey) ?? [],
          storageKey,
        });
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncCart]);

  // Keep localStorage in sync with every change (only after hydration, so a
  // page reload never clears a cart that was just loaded), and only in the
  // active namespace.
  useEffect(() => {
    if (!state.hydrated || !state.storageKey) return;
    saveCart(state.storageKey, state.items);
  }, [state.hydrated, state.items, state.storageKey]);

  const addItem = useCallback((product: Product, quantity: number) => {
    const item = buildCartItem(product, quantity);
    if (item) dispatch({ type: "add", item });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    dispatch({ type: "set-quantity", key, quantity });
  }, []);

  const removeItem = useCallback((key: string) => {
    dispatch({ type: "remove", key });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      itemCount: cartItemCount(state.items),
      subtotal: cartSubtotal(state.items),
      hasUnavailableItems: cartHasUnavailable(state.items),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [state.items, state.hydrated, addItem, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
