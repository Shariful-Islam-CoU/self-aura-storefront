"use client";

import { useCallback, useEffect, useReducer } from "react";
import { REVIEWS_PAGE_SIZE } from "../constants";
import { mapReviewResponse, mapReviewSummary } from "../lib/reviewMappers";
import {
  createReview,
  deleteReview as deleteReviewRequest,
  fetchProductReviews,
  toReviewError,
  updateReview,
  type ReviewError,
} from "../services/reviewService";
import type { ReviewFormValues } from "../lib/reviewValidation";
import type { ProductReviewsDataResponse, Review, ReviewSort, ReviewSummary } from "@/types/review";

type Status = "idle" | "loading" | "ready" | "error";
type SubmitStatus = "idle" | "submitting" | "saved";

/** Exported for testability, mirroring the cart/wishlist provider precedent. */
export interface ReviewsState {
  status: Status;
  summary: ReviewSummary | null;
  reviews: Review[];
  page: number;
  hasMore: boolean;
  sort: ReviewSort;
  error: ReviewError | null;
  loadingMore: boolean;
  loadMoreError: ReviewError | null;
  submitStatus: SubmitStatus;
  submitError: ReviewError | null;
  /** Id of the review currently open in the inline editor. */
  editingId: string | null;
  /** Bumped to force a re-read from the backend (after a write, or Retry). */
  attempt: number;
}

/** Exported for testability, mirroring the cart/wishlist provider precedent. */
export const REVIEWS_INITIAL_STATE: ReviewsState = {
  status: "idle",
  summary: null,
  reviews: [],
  page: 1,
  hasMore: false,
  sort: "recent",
  error: null,
  loadingMore: false,
  loadMoreError: null,
  submitStatus: "idle",
  submitError: null,
  editingId: null,
  attempt: 0,
};

/** Exported for testability, mirroring the cart/wishlist provider precedent. */
export type ReviewsAction =
  | { type: "loading" }
  | { type: "loaded"; payload: ProductReviewsDataResponse; append: boolean }
  | { type: "failed"; error: ReviewError }
  | { type: "loadMoreStart" }
  | { type: "loadMoreFailed"; error: ReviewError }
  | { type: "setSort"; sort: ReviewSort }
  | { type: "submitting" }
  | { type: "submitSucceeded" }
  | { type: "submitFailed"; error: ReviewError }
  | { type: "startEdit"; reviewId: string }
  | { type: "cancelEdit" }
  | { type: "refresh" };

/** Exported for testability, mirroring the cart/wishlist provider precedent. */
export function reviewsReducer(state: ReviewsState, action: ReviewsAction): ReviewsState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null };
    case "loaded": {
      const { summary, items, pagination } = action.payload;
      const reviews = items.map(mapReviewResponse);
      return {
        ...state,
        status: "ready",
        summary: mapReviewSummary(summary),
        reviews: action.append ? [...state.reviews, ...reviews] : reviews,
        page: pagination.page,
        hasMore: pagination.page < pagination.totalPages,
        error: null,
        loadingMore: false,
        loadMoreError: null,
      };
    }
    case "failed":
      return { ...state, status: "error", error: action.error, loadingMore: false };
    case "loadMoreStart":
      return { ...state, loadingMore: true, loadMoreError: null };
    case "loadMoreFailed":
      return { ...state, loadingMore: false, loadMoreError: action.error };
    case "setSort":
      return {
        ...state,
        sort: action.sort,
        // Re-read from page 1: ordering is the backend's job, never a local
        // re-sort of an already-fetched page.
        status: "loading",
        reviews: [],
        page: 1,
        hasMore: false,
        error: null,
      };
    case "submitting":
      return { ...state, submitStatus: "submitting", submitError: null };
    case "submitSucceeded":
      return { ...state, submitStatus: "saved", submitError: null, editingId: null };
    case "submitFailed":
      return { ...state, submitStatus: "idle", submitError: action.error };
    case "startEdit":
      return { ...state, editingId: action.reviewId, submitStatus: "idle", submitError: null };
    case "cancelEdit":
      return { ...state, editingId: null, submitStatus: "idle", submitError: null };
    case "refresh":
      return { ...state, attempt: state.attempt + 1 };
  }
}

export interface UseProductReviewsResult {
  status: Status;
  summary: ReviewSummary | null;
  reviews: Review[];
  error: ReviewError | null;
  sort: ReviewSort;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: ReviewError | null;
  loadMore: () => void;
  changeSort: (sort: ReviewSort) => void;
  retry: () => void;
  submitStatus: SubmitStatus;
  submitError: ReviewError | null;
  submitReview: (values: ReviewFormValues) => Promise<void>;
  editingReview: Review | null;
  startEdit: (review: Review) => void;
  cancelEdit: () => void;
  saveEdit: (values: ReviewFormValues) => Promise<void>;
  removeReview: (review: Review) => Promise<void>;
  /** The signed-in customer's own review, when the backend marks one. */
  ownReview: Review | null;
}

/**
 * All product-review state in one place: initial load, backend pagination,
 * backend-driven sorting, and the write paths (create / update / delete).
 *
 * Write policy: **no optimistic reviews.** A submission calls the backend,
 * and only after it confirms does the list + summary get re-read. The backend
 * is therefore always the source of truth, and there is no optimistic row to
 * roll back if a request fails.
 *
 * `enabled` gates every request. While the backend has no review API
 * (`REVIEWS_AVAILABLE === false`) this hook performs no network calls at all,
 * so product pages stay free of pointless 404 traffic.
 */
export function useProductReviews(
  productId: string,
  enabled: boolean
): UseProductReviewsResult {
  const [state, dispatch] = useReducer(reviewsReducer, REVIEWS_INITIAL_STATE);

  const { attempt, sort, page, loadingMore, editingId } = state;

  // Initial load / sort change / forced refresh.
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    fetchProductReviews({ productId, page: 1, limit: REVIEWS_PAGE_SIZE, sort })
      .then((payload) => {
        if (cancelled) return;
        dispatch({ type: "loaded", payload, append: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        dispatch({ type: "failed", error: toReviewError(error, "load") });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, productId, sort, attempt]);

  const loadMore = useCallback(() => {
    if (!enabled || loadingMore) return;
    dispatch({ type: "loadMoreStart" });

    fetchProductReviews({ productId, page: page + 1, limit: REVIEWS_PAGE_SIZE, sort })
      .then((payload) => {
        dispatch({ type: "loaded", payload, append: true });
      })
      .catch((error: unknown) => {
        dispatch({ type: "loadMoreFailed", error: toReviewError(error, "load") });
      });
  }, [enabled, loadingMore, productId, page, sort]);

  const changeSort = useCallback((nextSort: ReviewSort) => {
    dispatch({ type: "setSort", sort: nextSort });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: "refresh" });
  }, []);

  const submitReview = useCallback(
    async (values: ReviewFormValues) => {
      if (!enabled) return;
      dispatch({ type: "submitting" });
      try {
        await createReview({
          product: productId,
          rating: values.rating,
          comment: values.comment.trim(),
        });
        // Confirmed by the backend -> re-read list + summary.
        dispatch({ type: "submitSucceeded" });
        dispatch({ type: "refresh" });
      } catch (error: unknown) {
        dispatch({ type: "submitFailed", error: toReviewError(error, "submit") });
      }
    },
    [enabled, productId]
  );

  const saveEdit = useCallback(
    async (values: ReviewFormValues) => {
      if (!enabled || !editingId) return;
      dispatch({ type: "submitting" });
      try {
        await updateReview(editingId, {
          rating: values.rating,
          comment: values.comment.trim(),
        });
        dispatch({ type: "submitSucceeded" });
        dispatch({ type: "refresh" });
      } catch (error: unknown) {
        dispatch({ type: "submitFailed", error: toReviewError(error, "submit") });
      }
    },
    [enabled, editingId]
  );

  const removeReview = useCallback(
    async (review: Review) => {
      if (!enabled) return;
      dispatch({ type: "submitting" });
      try {
        await deleteReviewRequest(review.id);
        dispatch({ type: "submitSucceeded" });
        dispatch({ type: "refresh" });
      } catch (error: unknown) {
        dispatch({ type: "submitFailed", error: toReviewError(error, "submit") });
      }
    },
    [enabled]
  );

  const startEdit = useCallback((review: Review) => {
    dispatch({ type: "startEdit", reviewId: review.id });
  }, []);

  const cancelEdit = useCallback(() => {
    dispatch({ type: "cancelEdit" });
  }, []);

  const editingReview = state.reviews.find((review) => review.id === editingId) ?? null;
  const ownReview = state.reviews.find((review) => review.isOwnReview) ?? null;

  return {
    status: state.status,
    summary: state.summary,
    reviews: state.reviews,
    error: state.error,
    sort: state.sort,
    hasMore: state.hasMore,
    loadingMore: state.loadingMore,
    loadMoreError: state.loadMoreError,
    loadMore,
    changeSort,
    retry,
    submitStatus: state.submitStatus,
    submitError: state.submitError,
    submitReview,
    editingReview,
    startEdit,
    cancelEdit,
    saveEdit,
    removeReview,
    ownReview,
  };
}
