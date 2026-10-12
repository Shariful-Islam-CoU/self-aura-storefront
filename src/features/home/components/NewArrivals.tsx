import { ProductSection } from "./ProductSection";
import type { Product } from "@/types";

interface NewArrivalsProps {
  products: Product[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  return (
    <ProductSection
      id="new-arrivals"
      eyebrow="Just landed"
      title="New Arrivals"
      description="Fresh pieces from across the edit."
      products={products}
      ctaLabel="View All Products"
      ctaHref="/shop"
      className="border-y border-border bg-card"
    />
  );
}