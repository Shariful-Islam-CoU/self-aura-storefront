"use client";

import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AddToCartStatus } from "@/features/cart/types";

interface AddToCartButtonProps {
  /**
   * Disabled when the product is unavailable (out of stock) - the Add to Bag
   * action must never be reachable for an unavailable product.
   */
  disabled?: boolean;
  status?: AddToCartStatus;
  onClick?: () => void;
}

/**
 * Add-to-bag action for the details page.
 *
 * The action itself (availability + quantity validation, then the cart
 * service seam) lives in `useAddToCart`; this button only reflects that
 * state. Persistence arrives with the Cart module — until then the transient
 * "Added to bag" state is UI-only and reset shortly after.
 */
export function AddToCartButton({ disabled = false, status = "idle", onClick }: AddToCartButtonProps) {
  const isAdding = status === "adding";
  const isAdded = status === "added";

  return (
    <Button
      size="lg"
      className="w-full sm:flex-1"
      disabled={disabled || isAdding}
      isLoading={isAdding}
      onClick={onClick}
    >
      {isAdded ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      )}
      {isAdded ? "Added to bag" : "Add to bag"}
    </Button>
  );
}