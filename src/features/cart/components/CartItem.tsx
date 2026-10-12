"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { formatPrice } from "@/lib/utils/format";
import { QuantitySelector } from "@/features/products/components/QuantitySelector";
import { getAvailability } from "@/features/products/lib/availability";
import { useCart } from "../hooks/useCart";
import type { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
}

/**
 * One cart line: thumbnail, name, unit price, availability, quantity
 * stepper, line subtotal and remove. Reusable by the future checkout review.
 */
export function CartItem({ item }: CartItemProps) {
  const { setQuantity, removeItem } = useCart();
  const { product } = item;

  const availability = getAvailability(product);
  const unavailable = availability === "out-of-stock";
  const lowStock = availability === "low-stock";
  const lineSubtotal = product.sellingPrice * item.quantity;
  const productHref = `/products/${product.slug}`;

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      {/* Thumbnail. The frame reserves the 3:4 box and renders the shared
          styled fallback when the line has no image or the file 404s, so a
          saved cart from an older session (with a stale URL) degrades quietly
          instead of showing a broken-image glyph. */}
      <Link
        href={productHref}
        aria-label={`View ${product.name} details`}
        className={`relative block shrink-0 ${focusRing}`}
      >
        <ProductImageFrame
          src={product.image?.url}
          alt={product.image?.alt || product.name}
          sizes="96px"
          aspectRatio="3 / 4"
          rounded="rounded-md"
          fallbackLabel="—"
        />
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={productHref}
              className={`line-clamp-1 block text-sm font-medium text-foreground transition-colors hover:text-accent ${focusRing} rounded-sm`}
            >
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(product.sellingPrice)} each
            </p>
            {unavailable ? (
              <Badge variant="destructive" className="mt-2">
                Unavailable
              </Badge>
            ) : (
              lowStock && (
                <Badge variant="warning" className="mt-2">
                  Low stock
                </Badge>
              )
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {formatPrice(lineSubtotal)}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <QuantitySelector
            value={item.quantity}
            onChange={(next) => setQuantity(item.key, next)}
            min={1}
            max={product.stock > 0 ? product.stock : undefined}
            disabled={unavailable}
          />
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            aria-label={`Remove ${product.name} from cart`}
            className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-destructive ${focusRing}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}