"use client";

import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import type { CartContextValue } from "../context/CartContext";

/**
 * Access the centralized cart state. Must be used inside <CartProvider>
 * (mounted once in the root layout, so every storefront page can call it).
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}