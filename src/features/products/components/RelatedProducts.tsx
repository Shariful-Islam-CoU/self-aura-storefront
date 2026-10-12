import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types";

interface RelatedProductsProps {
  products: Product[];
}

/**
 * "You may also like" - real products from the same category (fetched
 * server-side via the existing backend category filter, excluding the current
 * product). Omitted entirely when there is nothing to show.
 */
export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-16 border-t border-border pt-10 sm:mt-20">
      <h2
        id="related-products-heading"
        className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
      >
        You may also like
      </h2>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}