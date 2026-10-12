"use client";

import { createContext } from "react";
import type { Product } from "@/types";
import type { CartItem } from "../types";

/**
 * The cart context contract. Exposed via `useCart()` - components never touch
 * the reducer directly, so cart state stays centralized.
 */
export interface CartContextValue {
  items: CartItem[];
  /** False until persisted cart data has been hydrated (client-only). */
  hydrated: boolean;
  /** Total quantity across all lines. */
  itemCount: number;
  /** Sum of line subtotals (product price × quantity). */
  subtotal: number;
  /** True when any line references an unavailable product. */
  hasUnavailableItems: boolean;
  /** Add a product (merges into the existing line when already present). */
  addItem: (product: Product, quantity: number) => void;
  /** Set a line's quantity (clamped to >= 1 and available stock). */
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);