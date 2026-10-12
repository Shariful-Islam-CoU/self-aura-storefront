import { Skeleton } from "@/components/ui/Skeleton";
import { ReviewCardSkeleton } from "./ReviewCard";

/**
 * Reviews section placeholder.
 *
 * Matches the real layout (score block + list rows) so the page doesn't jump
 * when the data lands. Decorative only - the wrapping region announces the
 * loading state for assistive technology.
 */
export function ReviewsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-10">
      <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
        <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
          <Skeleton className="h-10 w-16 text-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <ReviewCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
