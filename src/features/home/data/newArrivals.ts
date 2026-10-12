import type { Product } from "@/types";
import { demoProducts } from "@/features/products/lib/demoProducts";

/**
 * New Arrivals — placeholder subset of the demo catalogue.
 *
 * Adapter seam: when the product API is connected, this module becomes a
 * service call that maps `GET /products?sort=newest` into `Product[]`.
 * The <ProductSection> UI consumes `Product[]` and does not change.
 */
export const newArrivals: Product[] = demoProducts.slice(0, 8);