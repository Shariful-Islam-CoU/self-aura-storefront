/**
 * Product review & rating types for the storefront.
 *
 * TWO-LAYER APPROACH (same convention as `./product`):
 *
 * - `ReviewResponse`, `ProductReviewSummaryResponse`,
 *   `ProductReviewsDataResponse` — the wire contracts the storefront is
 *   written against.
 * - `Review` — the customer-safe display shape the UI consumes.
 *
 * IMPORTANT — backend status (verified against `self_aura_backend`):
 * the backend has **no review/rating functionality at all**. There is no
 * `Review` model, no `/reviews` route, no review service/repository/validator,
 * and no `averageRating` / `reviewCount` field on `ProductResponse`. The only
 * public endpoint is `GET /api/public/payment-settings`; product reads are
 * auth-gated. These types therefore describe the contract the storefront
 * expects from a future backend review API. They are declared here so the
 * integration seam is typed end-to-end, NOT because any endpoint currently
 * serves them. See `src/features/reviews/constants.ts` (`REVIEWS_AVAILABLE`)
 * and README §5 "Known backend limitation: no review or rating API".
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
 * The backend is expected to supply a privacy-safe display name (e.g. a masked
 * name). The storefront never invents, derives or falls back to anything the
 * backend did not send.
 */
export interface ReviewAuthorRef {
  /** Privacy-safe display name, e.g. "Sadia R." or "S*** A***". */
  displayName: string;
}

/** Wire shape: a single review. */
export interface ReviewResponse {
  id: string;
  /** Owning product's ObjectId — never rendered, only used for identity. */
  product: string;
  /** Whole-star rating within the backend's supported range (1..5). */
  rating: number;
  /** Customer-written review text. Plain text - never HTML. */
  comment: string;
  /** Privacy-safe author reference. */
  author?: ReviewAuthorRef;
  /**
   * Only true when the backend confirms the order was paid. The storefront
   * never derives this from local order data.
   */
  isVerifiedPurchase?: boolean;
  /**
   * True when the signed-in customer is the author. Supplied by the backend so
   * the storefront never needs the customer's internal id to decide ownership.
   */
  isOwnReview?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Per-star tallies for 1..5 (keys are the star values as strings). */
export type RatingDistributionResponse = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

/** Wire shape: aggregate rating for a product. */
export interface ProductReviewSummaryResponse {
  /** Mean rating, 1..5. Omitted entirely when there are no reviews. */
  averageRating?: number;
  reviewCount: number;
  /** Per-star counts. Omitted when the backend does not compute it. */
  distribution?: RatingDistributionResponse;
}

/** Wire shape: the paged review list payload. */
export interface ProductReviewsDataResponse {
  summary?: ProductReviewSummaryResponse;
  items: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** POST /reviews (create) request body. */
export interface CreateReviewRequest {
  /** Reviewed product ObjectId. */
  product: string;
  rating: number;
  comment: string;
}

/** PATCH /reviews/:id request body — partial update. */
export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
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
