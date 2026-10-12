/**
 * Review service - the single seam between the storefront and a backend
 * product-review API.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ BACKEND STATUS: these endpoints DO NOT EXIST TODAY.                   │
 * │                                                                       │
 * │ `self_aura_backend` was inspected: no `Review` model, no `/reviews`  │
 * │ route, no review service/repository/validator, and no rating fields   │
 * │ on `ProductResponse`. Every call in this file is therefore currently   │
 * │ unreachable — `ReviewsSection` gates on `REVIEWS_AVAILABLE` and issues │
 * │ no requests at all while it is `false`.                               │
 * │                                                                       │
 * │ The functions below document the contract the storefront is written   │
 * │ against, following this codebase's conventions exactly:               │
 * │   - `{ success, message, data }` envelope, unwrapped via `dataOrThrow`│
 * │   - paged lists return `{ items, pagination }`                        │
 * │   - `ApiError` for non-2xx, mapped to friendly copy by               │
 * │     `toReviewError` (raw backend messages never reach the UI)         │
 * │                                                                       │
 * │ When the backend adds the API, point these paths at the real routes   │
 * │ and flip `REVIEWS_AVAILABLE`. No component changes are required.      │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import { api, ApiError } from "@/lib/api/client";
import { buildQueryString } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  CreateReviewRequest,
  ProductReviewsDataResponse,
  ReviewResponse,
  ReviewSort,
  UpdateReviewRequest,
} from "@/types/review";

/* -------------------------------------------------------------------------- */
/* Error mapping                                                             */
/* -------------------------------------------------------------------------- */

export type ReviewErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not-allowed"
  | "already-reviewed"
  | "validation"
  | "not-found"
  | "unavailable"
  | "network"
  | "server";

export interface ReviewError {
  code: ReviewErrorCode;
  /** Short headline, e.g. "Sign in to write a review". */
  title: string;
  /** Customer-safe explanation. Never a raw backend message or stack. */
  description: string;
  /** Field-level messages the backend rejected, keyed by field name. */
  fieldErrors?: Partial<Record<"rating" | "comment", string>>;
  /** True when the customer must sign in before retrying. */
  requiresAuth: boolean;
}

/** True when a validation `details` item (path + message) points at a field. */
function hasDetailAt(details: unknown, field: string): boolean {
  if (!Array.isArray(details)) return false;
  return details.some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item as { path?: unknown }).path === field
  );
}

/**
 * Map any thrown error to a customer-friendly `ReviewError`.
 *
 * The storefront never surfaces a raw backend message: known statuses become
 * plain language, unknown ones become a generic retry prompt, and transport
 * failures are reported as a network problem.
 */
export function toReviewError(error: unknown, action: "load" | "submit"): ReviewError {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return {
          code: "unauthenticated",
          title: action === "submit" ? "Sign in to write a review" : "Sign in to see reviews",
          description:
            "Please sign in with your Self Aura account to read and write reviews for this product.",
          requiresAuth: true,
        };
      case 403:
        return {
          code: "forbidden",
          title:
            action === "submit"
              ? "You can't review this product"
              : "Reviews aren't available",
          // A 403 means the backend enforces a rule we did not pre-emptively
          // know. On submit that rule is the purchase requirement; on read it
          // simply means the reviews are not visible, so the copy must not
          // mention purchasing at all.
          description:
            action === "submit"
              ? "Only customers who purchased this product can review it. If you've just bought it, your review will be available shortly."
              : "We're not able to show reviews for this product right now.",
          requiresAuth: false,
        };
      case 409:
        return {
          code: "already-reviewed",
          title: "You've already reviewed this product",
          description:
            "You can edit your existing review below — one review per customer keeps ratings honest.",
          requiresAuth: false,
        };
      case 404:
        return {
          code: "not-found",
          title: "This product isn't available for review",
          description:
            "We couldn't find this product in the Self Aura collection. It may have been removed.",
          requiresAuth: false,
        };
      case 400: {
        const fieldErrors: Partial<Record<"rating" | "comment", string>> = {};
        const payload =
          typeof error.payload === "object" && error.payload !== null
            ? (error.payload as { details?: unknown })
            : {};

        if (hasDetailAt(payload.details, "rating")) {
          fieldErrors.rating = "Choose a rating from 1 to 5 stars.";
        }
        if (hasDetailAt(payload.details, "comment")) {
          fieldErrors.comment = "Please tell us about this product.";
        }

        return {
          code: "validation",
          title: "We couldn't save your review",
          description: "Please check your review and try again.",
          fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
          requiresAuth: false,
        };
      }
      case 503:
      case 502:
        return {
          code: "unavailable",
          title: "Reviews aren't available right now",
          description: "Our review service is taking a moment. Please try again shortly.",
          requiresAuth: false,
        };
      default:
        return {
          code: "server",
          title: "Something went wrong",
          description: "We couldn't reach Self Aura just now. Please try again in a moment.",
          requiresAuth: false,
        };
    }
  }

  if (error instanceof Error && (error.name === "TypeError" || error.name === "AbortError")) {
    return {
      code: "network",
      title: "We couldn't reach Self Aura",
      description: "Please check your internet connection and try again. Nothing was lost.",
      requiresAuth: false,
    };
  }

  return {
    code: "server",
    title: "Something went wrong",
    description: "Please try again in a moment.",
    requiresAuth: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                     */
/* -------------------------------------------------------------------------- */

export interface FetchReviewsParams {
  productId: string;
  page?: number;
  limit?: number;
  sort?: ReviewSort;
}

function dataOrThrow<T>(payload: ApiResponse<T> | null | undefined, label: string): T {
  if (!payload || payload.data === undefined || payload.data === null) {
    throw new ApiError(502, `Malformed ${label} response from the backend.`);
  }
  return payload.data;
}

/**
 * List reviews for a product, with the backend's own pagination and sorting.
 *
 * The storefront never re-sorts a page client-side and never requests more
 * than `limit` rows: ordering, paging and total counts are the backend's
 * responsibility so a large review set is never pulled into the browser.
 */
export async function fetchProductReviews({
  productId,
  page = 1,
  limit = 5,
  sort = "recent",
}: FetchReviewsParams): Promise<ProductReviewsDataResponse> {
  const query = buildQueryString({ page, limit, sortBy: sort });
  const response = await api.get<ApiResponse<ProductReviewsDataResponse>>(
    `/products/${productId}/reviews${query}`
  );
  return dataOrThrow(response, "reviews");
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Submit a review. Returns the backend-confirmed review — the storefront
 * then re-reads the list and summary rather than trusting a local guess, so
 * the backend stays the source of truth (no optimistic creation).
 */
export async function createReview(request: CreateReviewRequest): Promise<ReviewResponse> {
  const response = await api.post<ApiResponse<ReviewResponse>>("/reviews", request);
  return dataOrThrow(response, "review");
}

/** Update an existing review (partial: rating and/or comment). */
export async function updateReview(
  reviewId: string,
  request: UpdateReviewRequest
): Promise<ReviewResponse> {
  const response = await api.patch<ApiResponse<ReviewResponse>>(
    `/reviews/${reviewId}`,
    request
  );
  return dataOrThrow(response, "review");
}

/** Delete a review. Only surfaced when the backend supports customer deletes. */
export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/reviews/${reviewId}`);
}
