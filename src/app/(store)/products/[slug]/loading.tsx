import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";

/**
 * Streamed skeleton while the product details page loads. Mirrors the real
 * layout (breadcrumb, gallery, information, purchase row) to avoid jumping.
 */
export default function ProductLoading() {
  return <ProductDetailsSkeleton />;
}