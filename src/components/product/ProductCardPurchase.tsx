"use client";

import { useState } from "react";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import { QuantitySelector } from "@/features/products/components/QuantitySelector";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import type { Product } from "@/types";

/**
 * In-card purchase controls: a compact quantity stepper plus Add to bag.
 *
 * The stepper's maximum is the product's live stock, so the quantity can never
 * exceed what is available; `useAddToCart` re-validates the same bound before
 * anything reaches the cart.
 */
export function ProductCardPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { status, addToCart } = useAddToCart(product, quantity);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <QuantitySelector
          size="sm"
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={product.stock > 0 ? product.stock : undefined}
          disabled={status === "adding"}
        />
        <AddToCartButton
          size="sm"
          className="min-w-0 flex-1 whitespace-nowrap px-3"
          status={status}
          onClick={() => void addToCart()}
        />
      </div>
      {status === "error" && (
        <p role="alert" className="text-xs text-destructive">
          Couldn&apos;t add. Please try again.
        </p>
      )}
    </div>
  );
}
