"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import { loadCart, saveCart } from "../services/cartStorage";
import {
  buildCartItem,
  cartHasUnavailable,
  cartItemCount,
  cartReducer,
  cartSubtotal,
} from "./cartReducer";
import { CartContext } from "./CartContext";
import type { CartContextValue } from "./CartContext";
import type { CartState } from "../types";

/**
 * Centralized cart state for the whole storefront (Context + reducer).
 *
 * - Hydrates from localStorage once, on the client (never during SSR, so no
 *   hydration mismatch - the initial render is always an empty cart).
 * - Persists every change back to localStorage after hydration.
 * - Guards against unusable input (unavailable products are never added).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false } satisfies CartState);

  // Client-only hydration from the persisted cart.
  useEffect(() => {
    dispatch({ type: "hydrate", items: loadCart() ?? [] });
  }, []);

  // Keep localStorage in sync with every change (only after hydration, so a
  // page reload never clears a cart that was just loaded).
  useEffect(() => {
    if (state.hydrated) saveCart(state.items);
  }, [state.hydrated, state.items]);

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