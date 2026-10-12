/**
 * Product details skeleton - mirrors the page layout (breadcrumb, gallery,
 * info column, purchase row) with pulse blocks so loading never jumps.
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Breadcrumb */}
      <div className="h-4 w-48 animate-pulse rounded bg-border/50" />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="aspect-[4/5] rounded-lg border border-border bg-muted">
          <div className="h-full w-full animate-pulse bg-border/50" />
        </div>

        {/* Information */}
        <div className="space-y-5">
          <div className="h-3 w-24 animate-pulse rounded-full bg-border/50" />
          <div className="h-9 w-3/4 animate-pulse rounded-lg bg-border/50" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-border/50" />
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 animate-pulse rounded-full bg-border/50" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-border/50" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse rounded bg-border/50" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-border/50" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-border/50" />
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <div className="h-12 w-full max-w-[13rem] animate-pulse rounded-md bg-border/50 sm:w-40" />
            <div className="h-12 flex-1 animate-pulse rounded-md bg-border/50" />
          </div>
        </div>
      </div>
    </div>
  );
}