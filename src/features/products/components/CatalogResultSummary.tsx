import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { catalogHref } from "../lib/catalogParams";

interface CatalogResultSummaryProps {
  /** The committed search term, when there is one. */
  search?: string;
  /** Name of the active category, when there is one. */
  categoryName?: string;
  total: number;
}

/**
 * The line above the grid that tells the customer what they are looking at.
 *
 * The count comes straight from the backend's `pagination.total`, so it is
 * the real number of matching products - never a client-side tally, and never
 * an estimate. When the backend reports 0 the empty state below takes over, so
 * the summary is not rendered at all in that case.
 */
export function CatalogResultSummary({
  search,
  categoryName,
  total,
}: CatalogResultSummaryProps) {
  if (total === 0) return null;

  const productWord = total === 1 ? "product" : "products";

  return (
    <p role="status" className="text-sm text-muted-foreground">
      {search ? (
        <>
          <span className="text-foreground">Search results for &ldquo;{search}&rdquo;</span>
          {" · "}
        </>
      ) : categoryName ? (
        <>
          <span className="text-foreground">{categoryName}</span>
          {" · "}
        </>
      ) : null}
      {total} {productWord}
    </p>
  );
}

interface CatalogEmptyStateProps {
  /** True when a search term or category filter is narrowing the catalogue. */
  hasFilters: boolean;
  baseHref?: string;
}

/**
 * Shown when the backend returns zero products.
 *
 * Deliberately offers only routes that exist: "Browse shop" returns to the
 * unfiltered catalogue, and "View categories" points at the storefront's
 * existing categories section (the same target the header nav uses). No
 * "similar products" are suggested, because the backend has no recommendation
 * or related-search endpoint to source them from.
 */
export function CatalogEmptyState({ hasFilters, baseHref = "/shop" }: CatalogEmptyStateProps) {
  return (
    <EmptyState
      icon={<PackageSearch className="h-6 w-6" aria-hidden="true" />}
      title={hasFilters ? "No products found" : "The shop is empty"}
      description={
        hasFilters
          ? "We couldn't find anything matching your search or filters. Try a different search term or browse our categories."
          : "There are no products in the catalogue right now — please check back soon."
      }
      action={
        hasFilters ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href={catalogHref({}, baseHref)}>Browse shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#categories">View categories</Link>
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}
