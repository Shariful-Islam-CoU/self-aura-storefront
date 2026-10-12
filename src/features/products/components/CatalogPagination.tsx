import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogHref, type CatalogParams } from "../lib/catalogParams";
import type { PaginationMeta } from "@/types";

interface CatalogPaginationProps {
  pagination: PaginationMeta;
  current: CatalogParams;
  baseHref?: string;
}

const linkClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-sm text-foreground/80 transition-colors hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Server-rendered pagination. Uses the backend pagination metadata and keeps
 * every page in the URL (?page=), so refresh/share/back-forward all work.
 * Shows "Showing 1–12 of 48 products" when the API provides totals.
 */
export function CatalogPagination({
  pagination,
  current,
  baseHref = "/shop",
}: CatalogPaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const summary =
    total === 1
      ? "Showing 1 of 1 product"
      : `Showing ${from}–${to} of ${total} products`;

  // Small window of numbered pages around the current one.
  const pages: number[] = [];
  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let p = start; p <= end; p += 1) pages.push(p);

  const hrefFor = (target: number) =>
    catalogHref({ ...current, page: target }, baseHref);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">{summary}</p>

      {totalPages > 1 && (
        <ul className="flex items-center justify-center gap-1.5">
          <li>
            {page > 1 ? (
              <Link href={hrefFor(page - 1)} className={linkClass} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-disabled="true" className={cn(linkClass, "pointer-events-none opacity-40")}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </li>

          {pages.map((p) =>
            p === page ? (
              <li key={p}>
                <span
                  aria-current="page"
                  className={cn(linkClass, "border-accent/60 bg-accent/10 font-medium text-accent")}
                >
                  {p}
                </span>
              </li>
            ) : (
              <li key={p}>
                <Link href={hrefFor(p)} className={linkClass}>
                  {p}
                </Link>
              </li>
            )
          )}

          <li>
            {page < totalPages ? (
              <Link href={hrefFor(page + 1)} className={linkClass} aria-label="Next page">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-disabled="true" className={cn(linkClass, "pointer-events-none opacity-40")}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}