"use client";

import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWishlist } from "../hooks/useWishlist";

interface UnavailableWishlistItemProps {
  productId: string;
}

/**
 * Row for a saved item the catalogue can no longer serve (deleted product).
 * The item is NOT silently dropped from the wishlist - the customer decides,
 * so it stays until they remove it. Full-width so it never looks like a card
 * that lost its image.
 */
export function UnavailableWishlistItem({ productId }: UnavailableWishlistItemProps) {
  const { removeFromWishlist } = useWishlist();

  return (
    <li className="col-span-2 md:col-span-3 lg:col-span-4">
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-dashed border-border bg-card/50 px-5 py-4 sm:flex-row sm:items-center">
        <p className="flex items-center gap-3 text-sm text-muted-foreground">
          <PackageX className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>This saved item is no longer available. Keep it or remove it from your wishlist.</span>
        </p>
        <Button variant="outline" size="sm" onClick={() => removeFromWishlist(productId)}>
          Remove
        </Button>
      </div>
    </li>
  );
}