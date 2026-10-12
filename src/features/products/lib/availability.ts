import type { Product } from "@/types";

/**
 * Availability logic shared by every product surface (cards, details, cart,
 * wishlist). Mirrors the backend's public rule so the storefront never
 * disagrees with itself:
 *
 *   stock <= 0   -> out of stock
 *   lowStock     -> low stock (the backend derives this from the internal
 *                   reorder threshold, which it never publishes)
 *   otherwise    -> in stock
 *
 * `lowStock` is a backend-supplied boolean, so this module deliberately holds
 * no stock policy of its own.
 */

export type AvailabilityStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getAvailability(
  product: Pick<Product, "stock" | "lowStock">
): AvailabilityStatus {
  if (product.stock <= 0) return "out-of-stock";
  if (product.lowStock) return "low-stock";
  return "in-stock";
}

export function availabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "in-stock":
      return "In stock";
    case "low-stock":
      return "Low stock";
    case "out-of-stock":
      return "Out of stock";
  }
}
