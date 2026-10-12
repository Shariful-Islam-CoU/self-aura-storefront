"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { cartService } from "../services/cartService";
import { useCart } from "./useCart";
import type { AddToCartResult, AddToCartStatus } from "../types";

/**
 * Add-to-bag hook for the product details page.
 *
 * Validates availability + quantity against the real product stock, then adds
 * the product to the centralized cart (which merges with an existing line and
 * persists to localStorage). The action returns a typed result the UI can
 * render, and drives the transient status (idle -> adding -> added).
 */
export function useAddToCart(product: Product, quantity: number) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<AddToCartStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending "added" reset on unmount.
  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const addToCart = useCallback(async (): Promise<AddToCartResult> => {
    if (product.stock <= 0) {
      return { ok: false, error: "out-of-stock" };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return { ok: false, error: "invalid-quantity" };
    }

    setStatus("adding");
    // The cart service still validates the payload shape - the seam the
    // future Cart API will extend.
    const result = await cartService.addItem({ productId: product.id, quantity });
    if (!result.ok) {
      setStatus("error");
      return result;
    }

    // Commit to the real cart (merges + persists).
    addItem(product, quantity);

    setStatus("added");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2600);
    return { ok: true };
  }, [product, quantity, addItem]);

  return { status, addToCart };
}