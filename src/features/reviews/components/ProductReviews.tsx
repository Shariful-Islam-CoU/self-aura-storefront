"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { RatingSummary } from "./RatingSummary";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ReviewsSkeleton } from "./ReviewsSkeleton";
import { useProductReviews } from "../hooks/useProductReviews";
import {
  REVIEWS_AVAILABLE,
  REVIEWS_SUBMISSION_AVAILABLE,
  REVIEW_SORT_OPTIONS,
} from "../constants";
import type { Product } from "@/types";

interface ProductReviewsProps {
  product: Product;
}

/**
 * Reviews & Ratings section on /products/[slug].
 *
 * Placement: below the product information + purchase block, above related
 * products, so it reads as the closing part of the product story.
 *
 * ------------------------------------------------------------------------
 * BACKEND STATUS — the backend has NO review/rating API: no `Review` model, no
 * `/reviews` route, no review service/repository/validator, and no
 * `averageRating` / `reviewCount` / `distribution` on the product payload.
 * Rather than fabricate reviews or call an endpoint that does not exist, this
 * section renders an honest "not available yet" panel and issues **zero**
 * review requests while `REVIEWS_AVAILABLE` is `false`.
 *
 * Everything below the gate is fully implemented and typed: summary,
 * distribution, list, backend pagination and sorting, the write form, edit and
 * delete-with-confirmation, and every loading/error/empty state. Setting
 * `REVIEWS_AVAILABLE = true` (once the backend serves reviews) turns on the
 * live read experience with no changes to the components in this file.
 * ------------------------------------------------------------------------
 */
export function ProductReviews({ product }: ProductReviewsProps) {
  // The hook is called unconditionally (rules of hooks) but performs no
  // network work while the capability flag is off.
  const reviews = useProductReviews(product.id, REVIEWS_AVAILABLE);

  if (!REVIEWS_AVAILABLE) {
    return <ReviewsUnavailable productName={product.name} />;
  }

  const { status, summary, reviews: items, error } = reviews;
  // `idle` means "the first fetch has not landed yet", so it is a loading
  // state, not an empty one. Deriving it this way means the skeleton is part
  // of the server-rendered shell, so the section never flashes empty between
  // the server render and the first client fetch.
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
            <span className="sr-only">Loading reviews…</span>
            <ReviewsSkeleton />
          </div>
        )}

        {status === "error" && error && (
          <ErrorState title={error.title} description={error.description} onRetry={reviews.retry} />
        )}

        {status === "ready" && (
          <div className="space-y-10">
            {summary && <RatingSummary summary={summary} />}

            {hasNoReviews ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" aria-hidden="true" />}
                title="No reviews yet."
                description={
                  REVIEWS_SUBMISSION_AVAILABLE
                    ? "Be the first to review this product."
                    : "Be the first to review this product once customer accounts are available."
                }
              />
            ) : (
              <ReviewsList reviews={reviews} />
            )}

            <ReviewEntry reviews={reviews} />
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* List + backend pagination / sorting                                       */
/* -------------------------------------------------------------------------- */

function ReviewsList({ reviews }: { reviews: ReturnType<typeof useProductReviews> }) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="text-base font-semibold text-foreground">Customer reviews</h3>
        {/* Ordering is delegated to the backend; the storefront never re-sorts a
            page it has already fetched. */}
        <div className="w-44">
          <Select
            id="reviews-sort"
            label="Sort by"
            options={REVIEW_SORT_OPTIONS.map((option) => ({ ...option }))}
            value={reviews.sort}
            onChange={(event) => reviews.changeSort(event.target.value as never)}
          />
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard
              review={review}
              // Edit / delete are only offered on the customer's own review,
              // which the backend identifies with `isOwnReview`.
              onEdit={review.isOwnReview ? reviews.startEdit : undefined}
              onDelete={review.isOwnReview ? () => void reviews.removeReview(review) : undefined}
            />
          </li>
        ))}
      </ul>

      {reviews.hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={reviews.loadMore} disabled={reviews.loadingMore}>
            {reviews.loadingMore ? "Loading…" : "Load more reviews"}
          </Button>
          <p role="status" aria-live="polite" className="sr-only">
            {reviews.loadingMore ? "Loading more reviews" : ""}
          </p>
          {reviews.loadMoreError && (
            <p role="alert" className="text-sm text-destructive">
              {reviews.loadMoreError.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Write / edit entry point                                                  */
/* -------------------------------------------------------------------------- */

function ReviewEntry({ reviews }: { reviews: ReturnType<typeof useProductReviews> }) {
  const { editingReview, ownReview, submitStatus, submitError } = reviews;

  // Inline editor for the customer's existing review.
  if (editingReview) {
    return (
      <div className="space-y-4">
        <Separator />
        <ReviewForm
          mode="edit"
          initialValues={{ rating: editingReview.rating, comment: editingReview.comment }}
          onSubmit={reviews.saveEdit}
          onCancel={reviews.cancelEdit}
          error={submitError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Separator />

      {ownReview && (
        <div>
          <h3 className="text-base font-semibold text-foreground">Your review</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ve already reviewed this product. One review per customer keeps ratings honest.
          </p>
          <div className="mt-5">
            <Button variant="outline" onClick={() => reviews.startEdit(ownReview)}>
              Edit review
            </Button>
          </div>
        </div>
      )}

      {/* No existing review: offer to write one. */}
      {!ownReview && REVIEWS_SUBMISSION_AVAILABLE && (
        <>
          {submitStatus === "saved" && (
            <p
              role="status"
              className="rounded-md border border-success/30 bg-success/10 p-4 text-sm text-foreground"
            >
              Thanks for your review.
            </p>
          )}
          <ReviewForm onSubmit={reviews.submitReview} error={submitError} />
        </>
      )}

      {!ownReview && !REVIEWS_SUBMISSION_AVAILABLE && (
        <div>
          <h3 className="text-base font-semibold text-foreground">Write a review</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to write a review. Sharing your experience helps other customers choose
            with confidence.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Honest unavailable state                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Shown while the backend has no review API.
 *
 * Deliberately says nothing about counts, averages or customer opinions:
 * rendering "4.7 out of 5" or a review list would be fabricating data. The
 * copy is factual about *why* it is empty and never implies a rating exists.
 */
function ReviewsUnavailable({ productName }: { productName: string }) {
  return (
    <section aria-labelledby="reviews-heading" className="mt-16 sm:mt-20">
      <h2
        id="reviews-heading"
        className="font-display text-2xl font-medium tracking-tight text-foreground"
      >
        Reviews &amp; Ratings
      </h2>

      <div className="mt-8 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-foreground">No reviews yet.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Customer reviews for {productName} aren&apos;t available yet — Self Aura is preparing
          reviews and ratings. Every product detail on this page comes straight from our
          collection.
        </p>
      </div>
    </section>
  );
}
