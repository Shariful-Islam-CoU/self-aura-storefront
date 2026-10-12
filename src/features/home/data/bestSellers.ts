import type { Product } from "@/types";
import { demoProducts } from "@/features/products/lib/demoProducts";

/**
 * Best Sellers — placeholder subset of the demo catalogue.
 *
 * Adapter seam: when the product API is connected, this module becomes a
 * service call that maps `GET /products?sort=best-selling` into `Product[]`.
 * The <ProductSection> UI consumes `Product[]` and does not change.
 */
export const bestSellers: Product[] = demoProducts.slice(4, 12);