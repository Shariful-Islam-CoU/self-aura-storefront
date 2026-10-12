"use client";

import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/features/cart/hooks/useCart";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSummary } from "./CheckoutSummary";

/**
 * /checkout page body. Client component driven by the persisted cart.
 *
 * Guards (in order): hydration skeleton -> empty cart -> unavailable items.
 * The checkout form only renders when the cart can actually be ordered, so
 * nobody can "place an order" against an empty or broken bag. The backend
 * still revalidates everything when the order is created.
 */
export function CheckoutPageView() {
  const { items, hydrated, hasUnavailableItems } = useCart();

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Checkout
      </h1>

      {!hydrated ? (
        <CheckoutPageSkeleton />
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />}
            title="Your cart is empty"
            description="Checkout needs at least one item. Add a few pieces to your bag first."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/shop">Continue shopping</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cart">Return to cart</Link>
                </Button>
              </div>
            }
          />
        </div>
      ) : hasUnavailableItems ? (
        <div className="mt-10">
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
            title="Some items need your attention"
            description="Some items in your cart are no longer available. Please review your cart before placing an order."
            action={
              <Button asChild>
                <Link href="/cart">Return to cart</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <CheckoutForm />
          <CheckoutSummary className="lg:sticky lg:top-24" />
        </div>
      )}
    </Container>
  );
}

/** Mirrors the checkout layout (form column + summary rail) while hydrating. */
function CheckoutPageSkeleton() {
  return (
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
      <div className="space-y-6">
        {[0, 1, 2].map((section) => (
          <div key={section} className="space-y-4 rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-border/60" />
              <div className="h-5 w-48 animate-pulse rounded bg-border/60" />
            </div>
            <div className="h-10 w-full animate-pulse rounded-md bg-border/60" />
            <div className="h-10 w-full animate-pulse rounded-md bg-border/60" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-border/60" />
        <div className="h-3 w-full animate-pulse rounded bg-border/60" />
        <div className="h-12 w-full animate-pulse rounded-md bg-border/60" />
      </div>
    </div>
  );
}