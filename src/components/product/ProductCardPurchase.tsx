"use client";

import { useState } from "react";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import { QuantitySelector } from "@/features/products/components/QuantitySelector";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import type { Product } from "@/types";

/**
 * In-card purchase controls: a full-width quantity stepper with Add to bag
 * stacked underneath.
 *
 * Stacking (rather than sharing a row) gives each control the full card width,
 * so the stepper and button keep comfortable tap targets in the two-column
 * phone grid.
 *
 * The stepper's maximum is the product's live stock, so the quantity can never
 * exceed what is available; `useAddToCart` re-validates the same bound before
 * anything reaches the cart.
 */
export function ProductCardPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { status, addToCart } = useAddToCart(product, quantity);

  return (
    <div className="space-y-2">
      <QuantitySelector
        fullWidth
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={product.stock > 0 ? product.stock : undefined}
        disabled={status === "adding"}
      />
      <AddToCartButton
        size="md"
        className="w-full"
        status={status}
        onClick={() => void addToCart()}
      />
      {status === "error" && (
        <p role="alert" className="text-xs text-destructive">
          Couldn&apos;t add. Please try again.
        </p>
      )}
    </div>
  );
}
