"use client";

import { Container } from "@/components/layout/Container";
import { useCart } from "../hooks/useCart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { EmptyCart } from "./EmptyCart";

/**
 * /cart page body. Client component - the cart lives in client state.
 *
 * While the persisted cart is hydrating (first client render) a layout-stable
 * skeleton is shown so the page never flashes "empty" before the real items
 * appear.
 */
export function CartPageView() {
  const { items, itemCount, hydrated } = useCart();

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Cart{hydrated && itemCount > 0 ? ` (${itemCount})` : ""}
      </h1>

      {!hydrated ? (
        <CartPageSkeleton />
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyCart />
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <CartItem key={item.key} item={item} />
            ))}
          </ul>
          <CartSummary className="lg:sticky lg:top-24" />
        </div>
      )}
    </Container>
  );
}

/** Mirrors the cart layout (items list + summary) to avoid layout jump. */
function CartPageSkeleton() {
  return (
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
      <ul className="divide-y divide-border border-y border-border">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex gap-4 py-6 sm:gap-6">
            <div className="h-28 w-24 shrink-0 animate-pulse rounded-md bg-border/50" />
            <div className="flex flex-1 flex-col gap-3 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-border/50" />
              <div className="h-3 w-20 animate-pulse rounded bg-border/50" />
              <div className="h-3 w-24 animate-pulse rounded bg-border/50" />
              <div className="h-12 w-36 animate-pulse rounded-md bg-border/50" />
            </div>
          </li>
        ))}
      </ul>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-border/50" />
        <div className="h-4 w-full animate-pulse rounded bg-border/50" />
        <div className="h-12 w-full animate-pulse rounded-md bg-border/50" />
      </div>
    </div>
  );
}