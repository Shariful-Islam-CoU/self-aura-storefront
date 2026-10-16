/**
 * Loading skeletons that match the ProductCard / catalog layout so page
 * transitions don't jump. Purely decorative - labelled with sr-only text
 * for screen readers.
 */

export function ProductCardSkeleton() {
  return (
    <li>
      <div>
        <div className="aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted">
          <div className="h-full w-full animate-pulse bg-border/50" />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-border/50" />
            <div className="h-4 w-1/4 animate-pulse rounded-full bg-border/50" />
          </div>
          <div className="h-9 w-full animate-pulse rounded-md bg-border/50" />
        </div>
      </div>
    </li>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      role="list"
      aria-label="Loading products"
      className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </ul>
  );
}