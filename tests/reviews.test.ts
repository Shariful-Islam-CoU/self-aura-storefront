import { describe, expect, it } from "vitest";
import {
  mapReviewResponse,
  mapReviewSummary,
  mapReplyResponse,
  findOwnReview,
} from "@/features/reviews/lib/reviewMappers";
import {
  REVIEWS_INITIAL_STATE,
  reviewsReducer,
} from "@/features/reviews/hooks/useProductReviews";
import type {
  ProductReviewSummaryResponse,
  ReviewResponse,
} from "@/types/review";

/**
 * Storefront product-review contract tests.
 *
 * These lock the mapping from the backend's wire DTOs to the renderable display
 * shape, and the load-more behaviour that must not clobber the rating summary.
 * The backend is the source of truth for ratings, verified-purchase and
 * ownership - the storefront only renders what it is told.
 */

const wireReview = (overrides: Partial<ReviewResponse> = {}): ReviewResponse => ({
  id: "64c1f0010000000000000001",
  product: { id: "64a1f0010000000000000001", name: "Silver Ring", slug: "silver-ring" },
  rating: 5,
  title: "Beautiful",
  comment: "Loved it",
  author: { displayName: "Ayesha K." },
  isVerifiedPurchase: true,
  isOwnReview: false,
  replies: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("reviewMappers", () => {
  it("maps the backend review to the display shape", () => {
    const review = mapReviewResponse(wireReview());

    expect(review.id).toBe("64c1f0010000000000000001");
    expect(review.rating).toBe(5);
    expect(review.authorName).toBe("Ayesha K.");
    expect(review.isVerifiedPurchase).toBe(true);
    expect(review.isOwnReview).toBe(false);
    expect(review.replies).toEqual([]);
  });

  it("uses a neutral fallback for a missing display name", () => {
    const review = mapReviewResponse(
      wireReview({ author: { displayName: "" } })
    );

    expect(review.authorName).toBe("Self Aura customer");
  });

  it("maps replies, labelling an admin reply as the Self Aura team", () => {
    const admin = mapReplyResponse({
      id: "r1",
      authorType: "admin",
      authorName: "",
      text: "Thanks!",
    });
    const customer = mapReplyResponse({
      id: "r2",
      authorType: "customer",
      authorName: "Karim H.",
      text: "Agreed",
    });

    expect(admin.authorName).toBe("Self Aura Team");
    expect(customer.authorName).toBe("Karim H.");
  });

  it("flags the customer's own review without needing ids", () => {
    const reviews = [
      mapReviewResponse(wireReview()),
      mapReviewResponse(wireReview({ id: "other", isOwnReview: true })),
    ];

    expect(findOwnReview(reviews)?.id).toBe("other");
  });

  it("collapses an out-of-range rating to the minimum for display", () => {
    const review = mapReviewResponse(wireReview({ rating: 9 }));
    expect(review.rating).toBe(1);
  });
});

describe("mapReviewSummary", () => {
  it("returns a null average (never 0) when there are no reviews", () => {
    const summary: ProductReviewSummaryResponse = {
      averageRating: null,
      reviewCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    const mapped = mapReviewSummary(summary);
    expect(mapped.averageRating).toBeNull();
    expect(mapped.reviewCount).toBe(0);
    expect(mapped.hasDistribution).toBe(false);
  });

  it("keeps a fractional average and reports distribution presence", () => {
    const summary: ProductReviewSummaryResponse = {
      averageRating: 4.7,
      reviewCount: 7,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 5 },
    };

    const mapped = mapReviewSummary(summary);
    expect(mapped.averageRating).toBe(4.7);
    expect(mapped.reviewCount).toBe(7);
    expect(mapped.hasDistribution).toBe(true);
    expect(mapped.distribution[5]).toBe(5);
  });
});

describe("reviewsReducer", () => {
  const payload = {
    items: [wireReview()],
    pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    summary: {
      averageRating: 5,
      reviewCount: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    } as ProductReviewSummaryResponse,
  };

  it("stores the summary from the first page", () => {
    const state = reviewsReducer(REVIEWS_INITIAL_STATE, {
      type: "loaded",
      payload,
      append: false,
    });

    expect(state.status).toBe("ready");
    expect(state.summary?.averageRating).toBe(5);
    expect(state.reviews).toHaveLength(1);
    expect(state.hasMore).toBe(false);
  });

  it("preserves the held summary when a load-more page omits it", () => {
    const first = reviewsReducer(REVIEWS_INITIAL_STATE, {
      type: "loaded",
      payload,
      append: false,
    });

    const second = reviewsReducer(first, {
      type: "loaded",
      payload: {
        items: [wireReview({ id: "p2" })],
        pagination: { page: 2, limit: 5, total: 2, totalPages: 2 },
        // No summary on a later page.
      },
      append: true,
    });

    expect(second.reviews).toHaveLength(2);
    // The summary is not overwritten with zeros.
    expect(second.summary?.averageRating).toBe(5);
    expect(second.summary?.reviewCount).toBe(1);
  });

  it("clears the list and returns to loading when the sort changes", () => {
    const ready = reviewsReducer(REVIEWS_INITIAL_STATE, {
      type: "loaded",
      payload,
      append: false,
    });

    const resorted = reviewsReducer(ready, { type: "setSort", sort: "highest" });

    expect(resorted.sort).toBe("highest");
    expect(resorted.status).toBe("loading");
    expect(resorted.reviews).toEqual([]);
  });
});
