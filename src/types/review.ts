/**
 * Product review & rating types for the storefront.
 *
 * TWO-LAYER APPROACH (same convention as `./product`):
 *
 * - `ReviewResponse`, `ProductReviewSummaryResponse`,
 *   `ProductReviewsDataResponse` — the wire contracts served by
 *   `self_aura_backend`.
 * - `Review` — the customer-safe display shape the UI consumes.
 *
 * BACKEND CONTRACT (verified against `self_aura_backend`):
 *   - `GET  /api/catalogue/products/:productId/reviews`         public list
 *   - `GET  /api/catalogue/products/:productId/reviews/summary` public summary
 *   - `POST /api/customer/reviews`                              create own
 *   - `PATCH/DELETE /api/customer/reviews/:id`                  edit/delete own
 *   - `POST /api/customer/reviews/:id/replies`                  reply to own
 * The public reads accept an optional customer Bearer token so the backend can
 * set `isOwnReview`.
 *
 * PRIVACY: nothing here models customer email, phone, the internal customer
 * `_id`, admin notes or moderation state. A review is identified for "is this
 * mine?" purposes by the backend-supplied `isOwnReview` flag, never by the
 * storefront comparing ids.
 */

/** Lowest rating the storefront will ever accept (backend range 1..5). */
export const MIN_REVIEW_RATING = 1;

/** Highest rating the storefront will ever accept (backend range 1..5). */
export const MAX_REVIEW_RATING = 5;

/**
 * Customer identity as it appears on a review - display name only.
 *
 * The backend supplies a privacy-safe display name (first name + initial).
 * The storefront never invents, derives or falls back to anything the backend
 * did not send.
 */
export interface ReviewAuthorRef {
  /** Privacy-safe display name, e.g. "Ayesha K.". */
  displayName: string;
}

/** Wire shape: a single review reply. */
export interface ReviewReplyResponse {
  id: string;
  authorType: "customer" | "admin";
  /** Privacy-safe label supplied by the backend. */
  authorName?: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Wire shape: a single review. */
export interface ReviewResponse {
  id: string;
  /** Owning product reference — identity plus a renderable name. */
  product: { id: string; name?: string; slug?: string };
  /** Whole-star rating within the backend's supported range (1..5). */
  rating: number;
  /** Optional short headline. */
  title?: string;
  /** Customer-written review text. Plain text - never HTML. */
  comment: string;
  /** Privacy-safe author reference. */
  author: ReviewAuthorRef;
  /**
   * True when the backend confirms the purchase was delivered. The storefront
   * never derives this from local order data.
   */
  isVerifiedPurchase: boolean;
  /**
   * True when the signed-in customer is the author. Supplied by the backend so
   * the storefront never needs the customer's internal id to decide ownership.
   */
  isOwnReview: boolean;
  /** Replies to this review. */
  replies: ReviewReplyResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Per-star tallies for 1..5 (keys are the star values as strings). */
export type RatingDistributionResponse = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

/** Wire shape: aggregate rating for a product (dedicated summary endpoint). */
export interface ProductReviewSummaryResponse {
  /** Mean rating, 1..5, or null when the product has no reviews yet. */
  averageRating: number | null;
  reviewCount: number;
  /** Per-star counts for 1..5. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** Wire shape: the paged review list payload. */
export interface ProductReviewsDataResponse {
  /**
   * Aggregate rating. The backend serves this from a *separate* summary
   * endpoint, so the service fetches it alongside the first page and folds it
   * into the list payload the hook consumes. On later pages (load-more) the
   * summary is omitted, since the already-held one is still current.
   */
  summary?: ProductReviewSummaryResponse;
  items: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** POST /customer/reviews (create) request body. */
export interface CreateReviewRequest {
  /** Reviewed product ObjectId. */
  product: string;
  rating: number;
  /** Optional short headline. */
  title?: string;
  comment: string;
}

/** POST /customer/reviews/:id/replies (create reply) request body. */
export interface CreateReplyRequest {
  text: string;
}

/** PATCH /customer/reviews/:id request body — partial update. */
export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
}

/** PATCH /customer/reviews/:id/replies/:replyId (update reply) request body. */
export interface UpdateReplyRequest {
  text: string;
}

/**
 * Sort options the storefront offers.
 *
 * The backend is the authority on what it can sort by. `RECENT` is the only
 * option assumed to be universally available (it is the natural default
 * ordering); the rest are opt-in and validated against the backend's supported
 * set before being sent. See `REVIEW_SORT_OPTIONS` in
 * `src/features/reviews/constants.ts`.
 */
export type ReviewSort = "recent" | "highest" | "lowest";

/**
 * Storefront display shape: a customer-safe review reply.
 */
export interface ReviewReply {
  id: string;
  authorName: string;
  authorType: "customer" | "admin";
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** Storefront display shape: a customer-safe review. */
export interface Review {
  id: string;
  rating: number;
  comment: string;
  /** Privacy-safe display name, or a neutral fallback set by the mapper. */
  authorName: string;
  isVerifiedPurchase: boolean;
  isOwnReview: boolean;
  createdAt: string;
  updatedAt: string;
  /** Replies to this review. */
  replies: ReviewReply[];
}

/** Storefront display shape: aggregate rating. */
export interface ReviewSummary {
  /** Null when the product has no reviews yet (never a fabricated 0). */
  averageRating: number | null;
  reviewCount: number;
  /** Tallies indexed 1..5. Empty when the backend does not provide them. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** True only when the backend actually returned per-star counts. */
  hasDistribution: boolean;
}
