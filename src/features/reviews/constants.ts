/**
 * Product reviews feature - capability flag, constants and supported options.
 *
 * The backend status was verified directly against `self_aura_backend`:
 *
 *   - No `Review` model (see `src/models/` - no review/rating schema).
 *   - No review route (see `src/routes/index.ts` - no `/reviews` mount).
 *   - No review service, repository or validator.
 *   - No `averageRating` / `reviewCount` / `distribution` on
 *     `ProductResponse` (see `src/utils/productMappers.ts`).
 *   - The only public endpoint is `GET /api/public/payment-settings`;
 *     product reads are authentication + permission gated.
 *
 * So the storefront cannot load or submit a single real review today. Per
 * project rules the backend was not modified and no endpoint was invented or
 * called, and no review data is fabricated anywhere in this feature.
 */

/**
 * Whether the backend actually serves product reviews.
 *
 * `false` means: the Reviews & Ratings section renders an honest
 * "not available yet" panel and issues **zero** review requests (so product
 * pages make no pointless 404 traffic). Every component, type, service call
 * and state transition below is fully implemented and ready - flipping this to
 * `true` (once the backend exposes a review API) is the only change needed
 * for the live experience to appear.
 *
 * Do not set this to `true` speculatively: with no endpoint behind it, the
 * section would only show an error state.
 */
export const REVIEWS_AVAILABLE = false;

/**
 * Whether customers can actually **write** a review.
 *
 * Separate from `REVIEWS_AVAILABLE` because reading and writing have different
 * backend prerequisites, and the storefront should not imply one without the
 * other. Writing needs a customer session so a review can be attributed and
 * ownership enforced server-side. The backend has **no customer
 * authentication** (auth roles are `owner|manager|staff` only), so today no
 * reviewer can be identified.
 *
 * While `false`, guests see "Please sign in to write a review." linking to the
 * existing `/login` route - no second auth system, and no frontend-only
 * "who am I" guess. Turning this on requires backend customer auth plus a
 * review write endpoint; the write form, edit and delete paths are already
 * implemented behind it.
 */
export const REVIEWS_SUBMISSION_AVAILABLE = false;

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
