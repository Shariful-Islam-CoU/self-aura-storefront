"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductGridSkeleton } from "@/features/products/components/ProductCardSkeleton";
import { useWishlist } from "../hooks/useWishlist";
import { fetchWishlistProducts } from "../services/wishlistService";
import { WishlistItemCard } from "./WishlistItemCard";
import { UnavailableWishlistItem } from "./UnavailableWishlistItem";
import type { Product } from "@/types";
import type { WishlistViewStatus } from "../types";

type WishlistResults = Record<
  string,
  { state: "loaded"; product: Product } | { state: "missing" }
>;

/**
 * /wishlist page body (client).
 *
 * The wishlist stores product IDS only; every product shown here is fetched
 * fresh from the real catalogue, so prices/stock/availability are never stale
 * and nothing is ever fabricated. Results are cached per id in component
 * state, so re-renders (toggling another item) don't refetch, and a newly
 * added id is fetched on its own.
 *
 * Failure handling mirrors the rest of the storefront: a product that the
 * backend no longer knows (404) renders a removable "no longer available"
 * row, while a catalogue-wide failure (network/auth) shows a friendly retry
 * state. Raw backend errors are never surfaced.
 */
export function WishlistView() {
  const { productIds, hydrated } = useWishlist();
  const [results, setResults] = useState<WishlistResults>({});
  const [status, setStatus] = useState<WishlistViewStatus>("idle");

  // Fetch only ids we haven't resolved yet. This effect is re-entrant: once
  // every id has a result the guard makes it a no-op, so the state update
  // below can never loop. All setState calls live in async callbacks (not the
  // effect body) to avoid cascading renders.
  useEffect(() => {
    if (!hydrated || productIds.length === 0) return;

    const pending = productIds.filter((id) => !(id in results));
    if (pending.length === 0) return;

    let cancelled = false;
    void fetchWishlistProducts(pending)
      .then((fetched) => {
        if (cancelled) return;

        // Catalogue-wide failure (e.g. auth-gated API) rejects every request
        // for a non-404 reason. Only 404s are treated as "item removed".
        const loaded = fetched.filter((item) => item.status === "loaded");
        const transient = fetched.filter(
          (item) => item.status === "missing" && !item.notFound
        );
        if (loaded.length === 0 && transient.length > 0) {
          setStatus("error");
          return;
        }

        setResults((prev) => {
          const next: WishlistResults = { ...prev };
          for (const item of fetched) {
            next[item.id] =
              item.status === "loaded"
                ? { state: "loaded", product: item.product }
                : { state: "missing" };
          }
          return next;
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, productIds, results]);

  function handleRetry() {
    setResults({});
    setStatus("idle");
  }

  // A wishlist that is still empty once hydrated is genuinely empty.
  const isEmpty = hydrated && productIds.length === 0;
  const isLoading = !hydrated || (status === "idle" && productIds.length > 0);
  const hasError = status === "error";

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading your wishlist…</p>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (hasError) {
    return (
      <ErrorState
        title="We couldn't load your wishlist"
        description="We couldn't reach the collection just now. Your saved items are safe — please try again."
        onRetry={handleRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" aria-hidden="true" />}
        title="Your wishlist is empty"
        description="Save your favorite pieces and come back to them later."
        action={
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        }
      />
    );
  }

  // Render in wishlist order (order added); any id not yet resolved is skipped
  // for this frame and appears as soon as its fetch lands.
  const cards = productIds
    .map((id) => ({ id, result: results[id] }))
    .filter((entry): entry is { id: string; result: WishlistResults[string] } =>
      Boolean(entry.result)
    );

  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {cards.map(({ id, result }) =>
        result.state === "loaded" ? (
          <WishlistItemCard key={id} product={result.product} />
        ) : (
          <UnavailableWishlistItem key={id} productId={id} />
        )
      )}
    </ul>
  );
}