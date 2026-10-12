import { CatalogPageSkeleton } from "@/features/products/components/CatalogPageSkeleton";

/**
 * Streamed skeleton while the Category page re-renders for a new URL
 * (search, sort or page change). A category page's category is fixed by its
 * route, so it has no filter sidebar.
 */
export default function CategoryLoading() {
  return <CatalogPageSkeleton showFilters={false} />;
}