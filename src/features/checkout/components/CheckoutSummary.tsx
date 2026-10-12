"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/Separator";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/features/cart/hooks/useCart";

interface CheckoutSummaryProps {
  className?: string;
}

/**
 * Order summary rail for /checkout (right column on desktop, below the form
 * on mobile). For customer convenience only - the backend recalculates every
 * price, stock value, line total and the final order total during order
 * creation. Nothing here is authoritative.
 */
export function CheckoutSummary({ className }: CheckoutSummaryProps) {
  const { items, subtotal } = useCart();

  return (
    <aside
      aria-label="Order summary"
      className={cn("rounded-lg border border-border bg-card p-6", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
          Order summary
        </h2>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit cart
        </Link>
      </div>

      <ul className="mt-5 divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-3">
            <ProductImageFrame
              src={item.product.image?.url}
              alt={item.product.image?.alt || item.product.name}
              sizes="48px"
              aspectRatio="6 / 7"
              fallbackLabel="—"
              className="h-14 w-12 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.quantity} × {formatPrice(item.product.sellingPrice)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatPrice(item.product.sellingPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-foreground">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="text-muted-foreground">Confirmed at checkout</dd>
        </div>
      </dl>

      <Separator className="mt-4" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-label text-sm font-medium text-foreground">Estimated total</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatPrice(subtotal)}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Final prices, delivery charges and the order total are confirmed by Self Aura when your
        order is placed. This summary is for review only.
      </p>
    </aside>
  );
}