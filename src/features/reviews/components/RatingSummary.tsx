import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/utils/format";
import { StarRating } from "./StarRating";
import { RATING_MAX, RATING_MIN } from "../constants";
import type { ReviewSummary } from "@/types/review";

interface RatingSummaryProps {
  summary: ReviewSummary;
  className?: string;
}

/**
 * Aggregate rating block: average stars, the numeric score, the review count
 * and — only when the backend actually returns them — the per-star
 * distribution.
 *
 * Nothing is invented here: with no reviews it says so, and the distribution
 * block is omitted entirely rather than drawn as five empty bars (which would
 * imply "reviewed, all 1-star").
 */
export function RatingSummary({ summary, className }: RatingSummaryProps) {
  const { averageRating, reviewCount, distribution, hasDistribution } = summary;

  // Highest star first, matching the conventional distribution order.
  const rows = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, index) => {
    const star = RATING_MAX - index;
    return { star, count: distribution[star as 1 | 2 | 3 | 4 | 5] };
  });
  const maxCount = rows.reduce((max, row) => Math.max(max, row.count), 0);

  return (
    <div className={cn("grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10", className)}>
      {/* Score */}
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
        <p className="font-display text-4xl font-medium leading-none text-foreground">
          {averageRating === null ? "—" : averageRating}
        </p>
        <div>
          <StarRating value={averageRating ?? 0} size="md" />
          <p className="mt-2 text-sm text-muted-foreground">
            {averageRating === null
              ? "No reviews yet."
              : `${averageRating} out of ${RATING_MAX}`}
          </p>
        </div>
      </div>

      {/* Count + distribution */}
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          {reviewCount === 0
            ? "No reviews yet."
            : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}
        </p>

        {hasDistribution && maxCount > 0 && (
          <ul className="mt-4 space-y-2">
            {rows.map(({ star, count }) => {
              const percent = maxCount === 0 ? 0 : Math.round((count / maxCount) * 100);
              const label = `${star} ${star === 1 ? "star" : "stars"}`;

              return (
                <li key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-8 shrink-0 tabular-nums text-muted-foreground">{star}</span>
                  {/* The bar is decorative: the count and the "N stars" label
                      already carry the meaning for assistive tech. */}
                  <span
                    aria-hidden="true"
                    className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="sr-only">{label}:</span>
                  <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                    {formatCompact(count)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
