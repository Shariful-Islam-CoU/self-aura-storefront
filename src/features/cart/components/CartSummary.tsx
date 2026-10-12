"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "../hooks/useCart";

interface CartSummaryProps {
  className?: string;
}

/**
 * Order summary (right column on desktop, below items on mobile).
 *
 * Only backend-aware arithmetic happens here: item subtotal = price ×
 * quantity, cart subtotal = sum of lines. Taxes/shipping/discounts are
 * calculated by the backend at order creation and intentionally NOT
 * estimated here.
 *
 * "Proceed to checkout" links to /checkout (Cash on Delivery). It stays
 * disabled with an honest caption while any line is unavailable - the
 * backend revalidates everything when the order is placed.
 */
export function CartSummary({ className }: CartSummaryProps) {
  const { subtotal, hasUnavailableItems, clearCart } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <aside
      aria-label="Order summary"
      className={cn("rounded-lg border border-border bg-card p-6", className)}
    >
      <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
        Order summary
      </h2>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-foreground">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Shipping and taxes are calculated at checkout.
      </p>

      <Separator className="mt-5" />

      {hasUnavailableItems ? (
        <Button size="lg" className="mt-5 w-full" disabled>
          Proceed to checkout
        </Button>
      ) : (
        <Button size="lg" className="mt-5 w-full" asChild>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      )}
      {hasUnavailableItems ? (
        <p role="status" className="mt-3 text-sm text-destructive">
          Some items are unavailable — remove them from your cart to continue.
        </p>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Delivery and payment are confirmed at checkout.
        </p>
      )}

      {/* Clear cart - two-step confirmation; never clears by accident */}
      <div className="mt-6 border-t border-border pt-5">
        {confirmingClear ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Remove all items?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clearCart();
                setConfirmingClear(false);
              }}
            >
              Yes, clear cart
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear cart
          </Button>
        )}
      </div>
    </aside>
  );
}