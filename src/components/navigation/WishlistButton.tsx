"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";

/**
 * Wishlist entry point in the storefront header.
 *
 * - Always links to /wishlist (desktop + mobile) with a heart icon and an
 *   accessible label.
 * - Shows the total saved count as a badge; the count is read only after the
 *   wishlist hydrates (mirrors CartButton) so SSR and first client render
 *   agree (no hydration mismatch / layout flash).
 * - Renders as a plain icon button (like the account/search/cart icons) so it
 *   does not crowd the header.
 */
export function WishlistButton() {
  const { wishlistCount, hydrated } = useWishlist();
  const count = hydrated ? wishlistCount : 0;

  return (
    <Link
      href="/wishlist"
      aria-label={
        count > 0 ? `Wishlist, ${count} ${count === 1 ? "item" : "items"}` : "Wishlist, empty"
      }
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Heart className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}