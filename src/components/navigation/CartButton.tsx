"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/hooks/useCart";
import { CartPreview } from "@/features/cart/components/CartPreview";

/**
 * Cart entry point in the storefront header.
 *
 * - Always links to /cart (desktop + mobile).
 * - Shows the total item count as a badge (updates immediately on add,
 *   quantity change, remove, clear).
 * - Desktop hover/focus reveals a lightweight cart preview; on touch the
 *   icon simply navigates to /cart.
 */
export function CartButton() {
  const { itemCount, hydrated } = useCart();
  const count = hydrated ? itemCount : 0;

  return (
    <div className="group relative">
      <Link
        href="/cart"
        aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>

      {/* Lightweight preview - hover/focus only (desktop); hidden pre-hydration */}
      {hydrated && (
        <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <CartPreview />
          </div>
        </div>
      )}
    </div>
  );
}