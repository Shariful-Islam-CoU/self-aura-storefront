/**
 * Review service - the single seam between the storefront and the
 * `self_aura_backend` product-review API.
 *
 * Backend surface (routes/review.routes.ts):
 *   PUBLIC (optional customer Bearer for `isOwnReview`):
 *     GET    /catalogue/products/:productId/reviews          list approved (paged)
 *     GET    /catalogue/products/:productId/reviews/summary  aggregate rating
 *   CUSTOMER (authenticated customer, verified purchase):
 *     POST   /customer/reviews                               create own
 *     PATCH  /customer/reviews/:id                           edit own
 *     DELETE /customer/reviews/:id                           delete own
 *     POST   /customer/reviews/:id/replies                   reply to own review
 *
 * Paths are relative to the API base (`/api`). Conventions:
 *   - `{ success, message, data }` envelope, unwrapped via `dataOrThrow`;
 *   - paged lists return `{ items, pagination }`;
 *   - `ApiError` for non-2xx, mapped to friendly copy by `toReviewError`
 *     (raw backend messages never reach the UI).
 *
 * AUTH: the public reads accept the customer token when present so the backend
 * can mark `isOwnReview`; the customer writes require it. The token is read from
 * `localStorage` exactly like the rest of the storefront's services.
 */

import { api, ApiError, buildQueryString } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  CreateReplyRequest,
  CreateReviewRequest,
  ProductReviewsDataResponse,
  ProductReviewSummaryResponse,
  ReviewReplyResponse,
  ReviewResponse,
  ReviewSort,
  UpdateReplyRequest,
  UpdateReviewRequest,
} from "@/types/review";

/** Read the signed-in customer's token, if any. */
function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("customer_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
 *
 * On the first page the aggregate summary is fetched *in parallel* (the
 * backend serves it from its own endpoint) and folded into the payload, so the
 * UI has the rating summary as soon as the list resolves. Later pages omit it.
 */
export async function fetchProductReviews({
  productId,
  page = 1,
  limit = 5,
  sort = "recent",
}: FetchReviewsParams): Promise<ProductReviewsDataResponse> {
  const query = buildQueryString({ page, limit, sortBy: sort });

  if (page > 1) {
    const response = await api.get<ApiResponse<ProductReviewsDataResponse>>(
      `/catalogue/products/${productId}/reviews${query}`,
      { headers: authHeaders() }
    );
    return dataOrThrow(response, "reviews");
  }

  const [listResponse, summary] = await Promise.all([
    api.get<ApiResponse<ProductReviewsDataResponse>>(
      `/catalogue/products/${productId}/reviews${query}`,
      { headers: authHeaders() }
    ),
    fetchProductReviewSummary(productId),
  ]);

  return { ...dataOrThrow(listResponse, "reviews"), summary };
}

/**
 * Fetch the aggregate rating for a product.
 *
 * The backend exposes this as its own endpoint (the list payload carries no
 * summary), so the storefront reads it separately.
 */
export async function fetchProductReviewSummary(
  productId: string
): Promise<ProductReviewSummaryResponse> {
  const response = await api.get<ApiResponse<ProductReviewSummaryResponse>>(
    `/catalogue/products/${productId}/reviews/summary`,
    { headers: authHeaders() }
  );
  return dataOrThrow(response, "review summary");
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
  const response = await api.post<ApiResponse<ReviewResponse>>(
    "/customer/reviews",
    request,
    { headers: authHeaders() }
  );
  return dataOrThrow(response, "review");
}

/** Update an existing review (partial: rating and/or comment). */
export async function updateReview(
  reviewId: string,
  request: UpdateReviewRequest
): Promise<ReviewResponse> {
  const response = await api.patch<ApiResponse<ReviewResponse>>(
    `/customer/reviews/${reviewId}`,
    request,
    { headers: authHeaders() }
  );
  return dataOrThrow(response, "review");
}

/** Delete a review. Only surfaced when the backend supports customer deletes. */
export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/customer/reviews/${reviewId}`, {
    headers: authHeaders(),
  });
}

/* -------------------------------------------------------------------------- */
/* Replies                                                                    */
/* -------------------------------------------------------------------------- */

/** Add a reply to a review. */
export async function createReply(
  reviewId: string,
  request: CreateReplyRequest
): Promise<ReviewReplyResponse> {
  const response = await api.post<ApiResponse<ReviewReplyResponse>>(
    `/customer/reviews/${reviewId}/replies`,
    request,
    { headers: authHeaders() }
  );
  return dataOrThrow(response, "reply");
}

/** Update a reply on a review. */
export async function updateReply(
  reviewId: string,
  replyId: string,
  request: UpdateReplyRequest
): Promise<ReviewReplyResponse> {
  const response = await api.patch<ApiResponse<ReviewReplyResponse>>(
    `/customer/reviews/${reviewId}/replies/${replyId}`,
    request,
    { headers: authHeaders() }
  );
  return dataOrThrow(response, "reply");
}

/** Delete a reply from a review. */
export async function deleteReply(reviewId: string, replyId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/customer/reviews/${reviewId}/replies/${replyId}`, {
    headers: authHeaders(),
  });
}
