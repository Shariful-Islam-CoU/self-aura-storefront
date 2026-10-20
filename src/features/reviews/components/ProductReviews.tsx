"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingSummary } from "./RatingSummary";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ReviewsSkeleton } from "./ReviewsSkeleton";
import { useProductReviews } from "../hooks/useProductReviews";
import { REVIEWS_AVAILABLE, REVIEW_SORT_OPTIONS } from "../constants";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/types";
import type { ReviewSort } from "@/types/review";

interface ProductReviewsProps {
  product: Product;
}

/**
 * Product reviews section.
 *
 * Reads run for everyone (guests included): the backend public endpoints serve
 * approved reviews, and the storefront sends the customer's Bearer token when
 * present so the backend can mark the customer's own review. Writes require a
 * signed-in customer and are always confirmed by the backend before the list is
 * re-read - there is no optimistic row.
 *
 * When `REVIEWS_AVAILABLE` is false the hook issues no request at all and the
 * section explains that reviews are not available, so a product page never
 * generates pointless 404 traffic.
 */
export function ProductReviews({ product }: ProductReviewsProps) {
  const { isLoggedIn } = useAuth();
  const reviews = useProductReviews(product.id, REVIEWS_AVAILABLE);

  if (!REVIEWS_AVAILABLE) {
    return <ReviewsUnavailable productName={product.name} />;
  }

  const { status, summary, reviews: items, error } = reviews;
  const isInitialLoading = status === "idle" || status === "loading";
  const hasNoReviews = status === "ready" && items.length === 0;

  return (
    <section aria-labelledby="reviews-heading" className="mt-16 sm:mt-20">
      <h2
        id="reviews-heading"
        className="font-display text-2xl font-medium tracking-tight text-foreground"
      >
        Reviews &amp; Ratings
      </h2>

      <div className="mt-8">
        {isInitialLoading && (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading reviews...</span>
            <ReviewsSkeleton />
          </div>
        )}

        {status === "error" && error && (
          <ReviewsError error={error} onRetry={reviews.retry} />
        )}

        {status === "ready" && (
          <div className="space-y-10">
            {summary && summary.reviewCount > 0 && <RatingSummary summary={summary} />}

            {hasNoReviews ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" aria-hidden="true" />}
                title="No reviews yet."
                description={
                  isLoggedIn
                    ? "Be the first to review this product."
                    : "Sign in to be the first to review this product."
                }
              />
            ) : (
              <ReviewsList reviews={reviews} isLoggedIn={isLoggedIn} />
            )}

            <ReviewEntry reviews={reviews} isLoggedIn={isLoggedIn} />
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewsError({
  error,
  onRetry,
}: {
  error: { title: string; description: string };
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm"
    >
      <p className="font-medium text-foreground">{error.title}</p>
      <p className="mt-1 text-muted-foreground">{error.description}</p>
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function ReviewsList({
  reviews,
  isLoggedIn,
}: {
  reviews: ReturnType<typeof useProductReviews>;
  isLoggedIn: boolean;
}) {
  const { reviews: items, sort, hasMore, loadingMore, loadMoreError } = reviews;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="text-base font-semibold text-foreground">Customer reviews</h3>
        <div className="w-44">
          <label htmlFor="reviews-sort" className="mb-1 block text-sm font-medium text-foreground">
            Sort by
          </label>
          <select
            id="reviews-sort"
            value={sort}
            onChange={(event) => reviews.changeSort(event.target.value as ReviewSort)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {REVIEW_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {items.map((review) => (
          <li key={review.id}>
            <ReviewCard
              review={review}
              onEdit={review.isOwnReview ? reviews.startEdit : undefined}
              onDelete={review.isOwnReview ? reviews.removeReview : undefined}
              onReply={reviews.replyToReview}
              isLoggedIn={isLoggedIn}
            />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reviews.loadMore}
            disabled={loadingMore}
            isLoading={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more reviews"}
          </Button>
          {loadMoreError && (
            <p role="alert" className="text-sm text-destructive">
              {loadMoreError.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewEntry({
  reviews,
  isLoggedIn,
}: {
  reviews: ReturnType<typeof useProductReviews>;
  isLoggedIn: boolean;
}) {
  const { editingReview, ownReview, submitStatus, submitError } = reviews;

  if (editingReview) {
    return (
      <div className="space-y-4">
        <hr className="border-border" />
        <ReviewForm
          mode="edit"
          initialValues={{ rating: editingReview.rating, comment: editingReview.comment }}
          error={submitError}
          onSubmit={reviews.saveEdit}
          onCancel={reviews.cancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <hr className="border-border" />

      {ownReview && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Your review</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ve already reviewed this product. One review per customer keeps ratings
            honest.
          </p>
          {submitError && !submitError.fieldErrors && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {submitError.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => reviews.startEdit(ownReview)}>
              Edit review
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void reviews.removeReview(ownReview).catch(() => {
                  // Surfaced through submitError above; swallow to avoid an
                  // unhandled rejection.
                });
              }}
              isLoading={submitStatus === "submitting"}
            >
              Delete review
            </Button>
          </div>
        </div>
      )}

      {!ownReview && isLoggedIn && (
        <>
          {submitStatus === "saved" && (
            <p
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              Thanks for your review. It will appear once approved.
            </p>
          )}
          <ReviewForm error={submitError} onSubmit={reviews.submitReview} />
        </>
      )}

      {!ownReview && !isLoggedIn && (
        <div>
          <h3 className="text-base font-semibold text-foreground">Write a review</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to write a review. Sharing your experience helps other customers choose
            with confidence.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/login">
              <Button type="button" variant="outline">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button type="button" variant="ghost">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsUnavailable({ productName }: { productName: string }) {
  return (
    <section aria-labelledby="reviews-heading" className="mt-16 sm:mt-20">
      <h2
        id="reviews-heading"
        className="font-display text-2xl font-medium tracking-tight text-foreground"
      >
        Reviews &amp; Ratings
      </h2>

      <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-foreground">No reviews yet.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Customer reviews for {productName} aren&apos;t available yet - Self Aura is preparing
          reviews and ratings. Every product detail on this page comes straight from our
          collection.
        </p>
      </div>
    </section>
  );
}
