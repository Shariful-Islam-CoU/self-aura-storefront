import { ProductSection } from "./ProductSection";
import type { Product } from "@/types";

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  return (
    <ProductSection
      id="best-sellers"
      eyebrow="Customer favourites"
      title="Best Sellers"
      description="A preview pick from across the collection."
      products={products}
      ctaLabel="Shop Best Sellers"
      ctaHref="/shop"
    />
  );
}