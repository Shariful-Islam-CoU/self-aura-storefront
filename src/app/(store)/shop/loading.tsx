import { CatalogPageSkeleton } from "@/features/products/components/CatalogPageSkeleton";

/**
 * Streamed skeleton while the Shop page re-renders for a new URL
 * (search, sort, category or page change). Mirrors the real layout to
 * avoid layout jumping. `showFilters` matches the page's filter sidebar.
 */
export default function ShopLoading() {
  return <CatalogPageSkeleton showFilters />;
}
