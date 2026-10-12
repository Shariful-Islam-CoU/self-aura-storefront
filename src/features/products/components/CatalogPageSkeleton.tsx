import { Container } from "@/components/layout/Container";
import { ProductGridSkeleton } from "./ProductCardSkeleton";

interface CatalogPageSkeletonProps {
  /**
   * Show the filter sidebar. The Shop page has one (it can be filtered by
   * category); a category page cannot, so it renders a full-width grid.
   */
  showFilters?: boolean;
}

/**
 * Full catalog-page skeleton shown by `loading.tsx` during navigations that
 * change the URL (search, sort, category, page). Mirrors the real page
 * structure - sidebar, toolbar, grid - so the transition doesn't jump.
 *
 * It supplies its own `Container` because `loading.tsx` renders in place of the
 * page inside the layout, so the page's own wrapper isn't present. Reusing the
 * component keeps the two widths from ever drifting.
 */
export function CatalogPageSkeleton({ showFilters = false }: CatalogPageSkeletonProps) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <div className="h-3 w-24 animate-pulse rounded-full bg-border/50" />
        <div className="mt-4 h-10 w-52 animate-pulse rounded-lg bg-border/50" />
        <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded-full bg-border/50" />
      </div>

      {showFilters ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <div className="hidden space-y-3 lg:block">
            <div className="h-3 w-20 animate-pulse rounded-full bg-border/50" />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-8 w-full animate-pulse rounded-md bg-border/40" />
            ))}
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <div className="mb-1.5 h-4 w-28 animate-pulse rounded-full bg-border/50" />
                <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
              </div>
              <div className="w-44 sm:ml-auto sm:w-52">
                <div className="mb-1.5 h-4 w-12 animate-pulse rounded-full bg-border/50" />
                <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
              </div>
            </div>
            <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-border/50" />
            <div className="mt-6">
              <ProductGridSkeleton count={8} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <div className="mb-1.5 h-4 w-28 animate-pulse rounded-full bg-border/50" />
              <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
            </div>
            <div className="w-44 sm:ml-auto sm:w-52">
              <div className="mb-1.5 h-4 w-12 animate-pulse rounded-full bg-border/50" />
              <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
            </div>
          </div>
          <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-border/50" />
          <div className="mt-6">
            <ProductGridSkeleton count={8} />
          </div>
        </>
      )}
    </Container>
  );
}
