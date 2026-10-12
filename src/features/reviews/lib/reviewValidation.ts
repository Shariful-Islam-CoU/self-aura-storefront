/**
 * Review form validation - client-side guard rails only.
 *
 * IMPORTANT: these rules mirror the backend's expected review contract (rating
 * 1..5, non-empty review text) purely to give fast, friendly feedback. The
 * backend remains the authority and re-validates everything; a client check is
 * never treated as permission to submit.
 *
 * No arbitrary character limit is invented here beyond a generous UI guard -
 * a limit is only surfaced once the backend defines one, so the storefront can
 * never reject text the backend would have accepted.
 */

import { MAX_REVIEW_RATING, MIN_REVIEW_RATING } from "@/types/review";

export interface ReviewFormValues {
  /** 0 means "not chosen yet" - the submitted rating must be 1..5. */
  rating: number;
  comment: string;
}

export type ReviewFormErrors = Partial<Record<"rating" | "comment", string>>;

/**
 * Upper bound for the textarea counter.
 *
 * This is a UI affordance only (so the box cannot grow unbounded), NOT a
 * submission rule: `validateReviewForm` never rejects text for length. When
 * the backend defines a real limit, replace this constant and mirror the
 * backend's message.
 */
export const REVIEW_COMMENT_SOFT_LIMIT = 2000;

export function validateReviewForm(values: ReviewFormValues): ReviewFormErrors {
  const errors: ReviewFormErrors = {};

  const rating = values.rating;
  if (
    !Number.isInteger(rating) ||
    rating < MIN_REVIEW_RATING ||
    rating > MAX_REVIEW_RATING
  ) {
    errors.rating = `Choose a rating from ${MIN_REVIEW_RATING} to ${MAX_REVIEW_RATING} stars.`;
  }

  if (values.comment.trim().length === 0) {
    errors.comment = "Tell us about this product.";
  }

  return errors;
}

/** True when the form is submittable (no validation errors). */
export function isReviewFormValid(values: ReviewFormValues): boolean {
  return Object.keys(validateReviewForm(values)).length === 0;
}
