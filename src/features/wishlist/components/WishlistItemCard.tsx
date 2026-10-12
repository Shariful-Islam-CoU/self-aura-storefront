"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { getAvailability } from "@/features/products/lib/availability";
import type { Product } from "@/types";

/**
 * A wishlist line rendered on /wishlist: the standard ProductCard plus an
 * Add-to-bag action in the card footer (the only page that needs one).
 *
 * Availability comes from the LIVE catalogue data fetched by the wishlist
 * view - never from storage. A product the public catalogue no longer returns
 * (unpublished or deleted) drops out of this list entirely; out-of-stock
 * products keep the card (so they can be removed or checked later) but the
 * Add to Bag action is disabled, matching the details page rules.
 */
export function WishlistItemCard({ product }: { product: Product }) {
  const { status, addToCart } = useAddToCart(product, 1);
  const unavailable = getAvailability(product) === "out-of-stock";

  return (
    <ProductCard
      product={product}
      footerAction={
        unavailable || status === "error" ? (
          <p
            role="alert"
            className="rounded-md border border-dashed border-border px-3 py-2.5 text-center text-xs text-muted-foreground"
          >
            Currently unavailable
          </p>
        ) : (
          <AddToCartButton status={status} onClick={() => void addToCart()} />
        )
      }
    />
  );
}