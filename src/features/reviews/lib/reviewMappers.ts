/**
 * Review data mappers + validation - pure functions, no I/O.
 *
 * Kept separate from `reviewService` so the storefront's rules (customer-safe
 * field selection, rating clamping, summary maths) are testable in isolation
 * and can be reasoned about without the network.
 *
 * PRIVACY: the mappers are the single place where a backend review payload
 * becomes a renderable `Review`. They copy through display name, rating,
 * comment, verified-purchase and own-review flags, and timestamps. Email,
 * phone, the internal customer `_id`, admin notes and any moderation state are
 * never read, so they cannot reach the UI even if the backend adds them later.
 */

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  type ProductReviewSummaryResponse,
  type RatingDistributionResponse,
  type Review,
  type ReviewReply,
  type ReviewReplyResponse,
  type ReviewResponse,
  type ReviewSummary,
} from "@/types/review";
import { RATING_MAX, RATING_MIN } from "../constants";

/** Neutral author label used only when the backend sends no display name. */
const ANONYMOUS_AUTHOR = "Self Aura customer";

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Coerce a backend rating into the storefront's whole-star range.
 *
 * Anything outside 1..5 (or non-numeric, which the summary maths can produce
 * for an unrated product) collapses to `null` so it is never rendered as a
 * misleading star count.
 */
export function normalizeRating(value: unknown): number | null {
  const rating = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(rating)) return null;
  const rounded = Math.round(rating);
  if (rounded < MIN_REVIEW_RATING || rounded > MAX_REVIEW_RATING) return null;
  return rounded;
}

/** Map one wire reply to the customer-safe display shape. */
export function mapReplyResponse(response: ReviewReplyResponse): ReviewReply {
  const displayName = readString(response.authorName).trim();

  return {
    id: readString(response.id),
    authorName: displayName || (response.authorType === "admin" ? "Self Aura Team" : ANONYMOUS_AUTHOR),
    authorType: response.authorType,
    text: readString(response.text),
    createdAt: readString(response.createdAt),
    updatedAt: readString(response.updatedAt),
  };
}

/** Map one wire review to the customer-safe display shape. */
export function mapReviewResponse(response: ReviewResponse): Review {
  const displayName = readString(response.author?.displayName).trim();

  return {
    id: readString(response.id),
    rating: normalizeRating(response.rating) ?? MIN_REVIEW_RATING,
    // Plain text only. React escapes it on render, and nothing here uses
    // dangerouslySetInnerHTML, so customer HTML can never execute.
    comment: readString(response.comment),
    authorName: displayName || ANONYMOUS_AUTHOR,
    // Verified purchase is shown only when the backend asserts it - it is
    // never inferred from local order state.
    isVerifiedPurchase: response.isVerifiedPurchase === true,
    isOwnReview: response.isOwnReview === true,
    createdAt: readString(response.createdAt),
    updatedAt: readString(response.updatedAt),
    replies: (response.replies ?? []).map(mapReplyResponse),
  };
}

/** Normalize a partial per-star tally into a dense 1..5 record. */
export function mapDistribution(
  distribution: RatingDistributionResponse | undefined
): { counts: Record<1 | 2 | 3 | 4 | 5, number>; hasDistribution: boolean } {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!distribution || typeof distribution !== "object") {
    return { counts, hasDistribution: false };
  }

  let hasAny = false;
  for (let star = RATING_MIN; star <= RATING_MAX; star += 1) {
    const raw = (distribution as Record<string, unknown>)[String(star)];
    const count = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
    counts[star as 1 | 2 | 3 | 4 | 5] = count;
    if (count > 0) hasAny = true;
  }
  return { counts, hasDistribution: hasAny };
}

/**
 * Read a *fractional* average rating (e.g. 4.7) without rounding to a whole
 * star - rounding is a display concern, handled by the star glyph.
 *
 * Out-of-range or non-numeric values yield `null`, so a bad payload shows
 * "no ratings yet" instead of a misleading score.
 */
export function normalizeAverageRating(value: unknown): number | null {
  const average = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(average)) return null;
  if (average < MIN_REVIEW_RATING || average > MAX_REVIEW_RATING) return null;
  return Math.round(average * 10) / 10;
}

/**
 * Map the backend's aggregate rating.
 *
 * With no reviews the average is `null` - never `0`, which would read as
 * "terrible" instead of "not rated yet".
 */
export function mapReviewSummary(
  summary: ProductReviewSummaryResponse | undefined
): ReviewSummary {
  const reviewCount =
    typeof summary?.reviewCount === "number" && Number.isFinite(summary.reviewCount)
      ? Math.max(0, Math.floor(summary.reviewCount))
      : 0;

  const { counts, hasDistribution } = mapDistribution(summary?.distribution);

  return {
    averageRating: normalizeAverageRating(summary?.averageRating),
    reviewCount,
    distribution: counts,
    hasDistribution,
  };
}

/** The customer's existing review in a list, if the backend marked one. */
export function findOwnReview(reviews: Review[]): Review | null {
  return reviews.find((review) => review.isOwnReview) ?? null;
}
