"use client";

import Link from "next/link";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "../hooks/useCart";

/**
 * Lightweight cart preview panel (shown under the header cart icon on
 * hover/focus). Read-only line summary + subtotal + "View cart".
 *
 * Kept intentionally small - the full experience lives on /cart.
 */
export function CartPreview() {
  const { items, subtotal, hydrated } = useCart();

  // Never render before hydration - the panel would flash an empty cart.
  if (!hydrated) return null;

  if (items.length === 0) {
    return <p className="p-5 text-sm text-muted-foreground">Your cart is empty.</p>;
  }

  return (
    <div className="w-80 max-w-[85vw]">
      <ul className="max-h-72 divide-y divide-border overflow-y-auto px-4 py-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-3">
            {/* Decorative: the product name is right next to it, so `alt=""` and
                the frame's own fallback keep the row from showing a broken
                image when a saved cart points at a file that no longer exists. */}
            <ProductImageFrame
              src={item.product.image?.url}
              alt=""
              sizes="44px"
              aspectRatio="11 / 14"
              rounded="rounded"
              fallbackLabel="—"
              className="h-14 w-11 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {formatPrice(item.product.sellingPrice)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatPrice(item.product.sellingPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatPrice(subtotal)}
        </span>
      </div>

      <div className="border-t border-border p-3">
        <Link
          href="/cart"
          className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-label text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}