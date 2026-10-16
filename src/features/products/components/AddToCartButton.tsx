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
  /** Button scale. `lg` (default) is the details-page action; `sm` fits a card. */
  size?: "sm" | "md" | "lg";
  /** Layout classes. Defaults to the details-page full-width action. */
  className?: string;
}

/**
 * Add-to-bag action for the details page.
 *
 * The action itself (availability + quantity validation, then the cart
 * service seam) lives in `useAddToCart`; this button only reflects that
 * state. Persistence arrives with the Cart module — until then the transient
 * "Added to bag" state is UI-only and reset shortly after.
 */
export function AddToCartButton({
  disabled = false,
  status = "idle",
  onClick,
  size = "lg",
  className = "w-full sm:flex-1",
}: AddToCartButtonProps) {
  const isAdding = status === "adding";
  const isAdded = status === "added";
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Button
      size={size}
      className={className}
      disabled={disabled || isAdding}
      isLoading={isAdding}
      onClick={onClick}
    >
      {isAdded ? (
        <Check className={iconClass} aria-hidden="true" />
      ) : (
        <ShoppingBag className={iconClass} aria-hidden="true" />
      )}
      {isAdded ? "Added to bag" : "Add to bag"}
    </Button>
  );
}