/**
 * Product reviews feature - capability flag, constants and supported options.
 *
 * The backend now serves product reviews via:
 *   - GET api/catalogue/products/:productId/reviews (public, approved only)
 *   - GET api/catalogue/products/:productId/reviews/summary (public)
 *   - POST api/customer/reviews (authenticated customer, verified purchase)
 *   - PATCH/DELETE api/customer/reviews/:id (own review)
 */

/**
 * Whether the backend actually serves product reviews.
 *
 * `true` enables reading reviews for all visitors (guests and logged-in customers).
 * The backend public endpoints serve approved reviews only.
 */
export const REVIEWS_AVAILABLE = true;

/** Star range supported by the storefront (mirrors the backend's 1..5). */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/** Human label per star value, used for accessible text. */
export const RATING_VALUE_LABELS: Record<number, string> = {
  1: "1 star",
  2: "2 stars",
  3: "3 stars",
  4: "4 stars",
  5: "5 stars",
};

/**
 * Sort options the storefront offers.
 *
 * `recent` is the natural default ordering. `highest` / `lowest` are only sent
 * when the backend declares support (`supportedReviewSorts`), so the storefront
 * never performs misleading client-side sorting over a large review set.
 */
export const REVIEW_SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
] as const;

/** Page size used when asking the backend for reviews. */
export const REVIEWS_PAGE_SIZE = 5;
