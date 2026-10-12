"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useWishlist } from "../hooks/useWishlist";

type WishlistToggleVariant = "icon" | "button";

interface WishlistToggleProps {
  productId: string;
  productName: string;
  /** "icon" = compact heart (product cards); "button" = labeled action (details). */
  variant?: WishlistToggleVariant;
  /** Extra classes - used to position the icon variant on card media. */
  className?: string;
}

/**
 * Reusable wishlist/favorite toggle - the ONLY place wishlist actions happen.
 *
 * - Icon variant: outline heart when not saved, filled heart when saved. The
 *   selected state is unmistakable (filled + accent tint + aria-pressed).
 * - Button variant: full-width labeled action that flips between
 *   "Add to Wishlist" / "Remove from Wishlist".
 * - Labels are announcement-quality ("Add <name> to wishlist") and the saved
 *   state is conveyed via `aria-pressed`, so the control is never a bare icon.
 * - Pre-hydration the control renders as "not saved" (mirroring the header
 *   count behaviour) - avoids SSR/client mismatches.
 * - Toggling is instant (local state): there is no server round-trip to
 *   freeze the page on.
 */
export function WishlistToggle({ productId, productName, variant = "icon", className }: WishlistToggleProps) {
  const { isInWishlist, toggleWishlist, hydrated } = useWishlist();
  const saved = hydrated && isInWishlist(productId);
  const label = saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`;

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        aria-pressed={saved}
        aria-label={label}
        onClick={() => toggleWishlist(productId)}
        className={cn("w-full", className)}
      >
        <Heart
          className={cn("h-4 w-4 transition-transform duration-200", saved && "scale-110 fill-current text-accent")}
          aria-hidden="true"
        />
        {saved ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur transition-all hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95",
        saved ? "text-accent" : "text-foreground/70",
        className
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          saved ? "scale-110 fill-current" : "group-hover:scale-110"
        )}
      />
    </button>
  );
}