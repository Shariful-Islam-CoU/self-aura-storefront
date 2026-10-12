import { ApiError } from "@/lib/api/client";
import { catalogService } from "@/services/catalogService";
import type { WishlistProductResult } from "../types";

/**
 * Wishlist data seam.
 *
 * The backend has no wishlist API, so saved ids live in localStorage and the
 * CURRENT product data is fetched from the real catalogue when the wishlist
 * page renders (`GET /products/:id` per saved id). No fake responses are ever
 * produced and no stale price stored in localStorage is trusted. The fetch is
 * tolerant per item: a single deleted/unpublished product resolves to
 * "missing" without failing the whole page. A product that no longer exists
 * (backend 404) is flagged `notFound` so the page renders a graceful
 * "unavailable" row instead of a page-level error.
 */
export async function fetchWishlistProducts(ids: string[]): Promise<WishlistProductResult[]> {
  const settled = await Promise.allSettled(ids.map((id) => catalogService.fetchProductById(id)));
  return settled.map((result, index) => {
    const id = ids[index];
    if (result.status === "fulfilled") {
      return { id, status: "loaded" as const, product: result.value };
    }
    const notFound = result.reason instanceof ApiError && result.reason.status === 404;
    return { id, status: "missing" as const, notFound };
  });
}