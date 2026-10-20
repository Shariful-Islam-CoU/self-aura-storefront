"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { StarRating } from "./StarRating";
import {
  REVIEW_COMMENT_SOFT_LIMIT,
  validateReviewForm,
  type ReviewFormValues,
} from "../lib/reviewValidation";
import type { ReviewError } from "../services/reviewService";

type SubmitState = "idle" | "submitting";

export interface ReviewFormProps {
  /**
   * Submits the values and resolves on success. The parent re-reads the
   * backend afterwards - this component never mutates the review list itself,
   * so there is no optimistic review and nothing to roll back.
   */
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  /** Backend/transport error from the last attempt, if any. */
  error?: ReviewError | null;
  /** Pre-fills the form when editing an existing review. */
  initialValues?: ReviewFormValues;
  /** Editing mode changes the heading and the submit label. */
  mode?: "create" | "edit";
  /** Called by Cancel in edit mode. */
  onCancel?: () => void;
}

/**
 * Write / edit a review.
 *
 * Validation runs before the request (fast, friendly feedback) and the backend
 * re-validates everything regardless - a passing client check never implies
 * permission to submit. The submit button is disabled for the whole in-flight
 * request so a double click can't create two reviews.
 */
export function ReviewForm({
  onSubmit,
  error,
  initialValues,
  mode = "create",
  onCancel,
}: ReviewFormProps) {
  const isEdit = mode === "edit";
  const [values, setValues] = useState<ReviewFormValues>(
    initialValues ?? { rating: 0, comment: "" }
  );
  const [fieldErrors, setFieldErrors] = useState<{ rating?: string; comment?: string }>({});
  const [state, setState] = useState<SubmitState>("idle");

  const ratingErrorId = useId();
  const commentErrorId = useId();
  const submitting = state === "submitting";

  async function handleSubmit() {
    const errors = validateReviewForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setState("submitting");
    try {
      await onSubmit(values);
      // Success: clear the draft so a stale half-written review can't linger.
      if (!isEdit) setValues({ rating: 0, comment: "" });
    } catch {
      // The failure is reported to this component through the `error` prop
      // (the parent hook records it); swallowing here just prevents an
      // unhandled rejection from a fire-and-forget submit.
    } finally {
      setState("idle");
    }
  }

  const ratingError = fieldErrors.rating ?? error?.fieldErrors?.rating;
  const commentError = fieldErrors.comment ?? error?.fieldErrors?.comment;
  const commentLength = values.comment.length;
  const overSoftLimit = commentLength > REVIEW_COMMENT_SOFT_LIMIT;

  return (
    <form
      className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      noValidate
    >
      <h3 className="text-base font-semibold text-foreground">
        {isEdit ? "Edit your review" : "Write a review"}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Share your experience with this product. It helps other customers choose confidently.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <StarRating
            value={values.rating}
            onChange={(rating) => {
              setValues((previous) => ({ ...previous, rating }));
              if (fieldErrors.rating) setFieldErrors((previous) => ({ ...previous, rating: undefined }));
            }}
            label={isEdit ? "Your rating" : "Rating"}
            size="lg"
            invalid={Boolean(ratingError)}
            describedBy={ratingError ? ratingErrorId : undefined}
          />
          {ratingError && (
            <p id={ratingErrorId} role="alert" className="mt-2 text-sm text-destructive">
              {ratingError}
            </p>
          )}
        </div>

        <Textarea
          id="review-comment"
          label={isEdit ? "Your review" : "Review"}
          placeholder="Share your experience with this product"
          rows={5}
          required
          maxLength={REVIEW_COMMENT_SOFT_LIMIT}
          value={values.comment}
          error={commentError}
          helperText={`${commentLength} / ${REVIEW_COMMENT_SOFT_LIMIT}`}
          disabled={submitting}
          onChange={(event) => {
            const comment = event.target.value;
            setValues((previous) => ({ ...previous, comment }));
            if (fieldErrors.comment) setFieldErrors((previous) => ({ ...previous, comment: undefined }));
          }}
          aria-describedby={commentError ? commentErrorId : undefined}
        />

        {overSoftLimit && (
          <p className="text-sm text-muted-foreground">
            Reviews are usually shorter - trimming yours will help other customers read it.
          </p>
        )}
      </div>

      {error && !error.fieldErrors && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error.description}
        </p>
      )}

      {/* Screen-reader status for the in-flight request. */}
      <p role="status" aria-live="polite" className="sr-only">
        {submitting ? "Saving your review" : ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" isLoading={submitting} disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Submit review"}
        </Button>
        {isEdit && onCancel && (
          <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
