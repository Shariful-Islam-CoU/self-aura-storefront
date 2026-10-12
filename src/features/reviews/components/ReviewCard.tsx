"use client";

import { useState } from "react";
import { BadgeCheck, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StarRating } from "./StarRating";
import { formatDate, isMeaningfullyUpdated } from "@/lib/utils/format";
import type { Review } from "@/types/review";

export interface ReviewCardOwnActions {
  /** Starts the inline edit form for this review. */
  onEdit?: (review: Review) => void;
  /** Requests deletion; the parent owns the confirmation step. */
  onDelete?: (review: Review) => void;
}

interface ReviewCardProps extends ReviewCardOwnActions {
  review: Review;
}

/**
 * A single customer review.
 *
 * Customer-safe fields only — the review is already mapped to the safe
 * `Review` shape upstream, so there is no email, phone, internal id or admin
 * note available to leak here. Review text renders as plain text inside a
 * whitespace-pre-line paragraph: React escapes it and nothing in this component
 * uses `dangerouslySetInnerHTML`, so customer-authored HTML can never execute.
 *
 * "Verified Purchase" appears only when the backend asserted
 * `isVerifiedPurchase`; it is never derived from local order state.
 */
export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const showActions = Boolean(onEdit || onDelete);
  const wasEdited = isMeaningfullyUpdated(review.updatedAt, review.createdAt);
  const createdLabel = formatDate(review.createdAt);
  const updatedLabel = wasEdited ? formatDate(review.updatedAt) : "";

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{review.authorName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating value={review.rating} size="sm" />
            {review.isVerifiedPurchase && (
              <Badge variant="success">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Verified Purchase
              </Badge>
            )}
            {review.isOwnReview && <Badge variant="accent">Your review</Badge>}
          </div>
        </div>

        {createdLabel && (
          <p className="shrink-0 text-xs text-muted-foreground">
            <time dateTime={review.createdAt}>{createdLabel}</time>
            {wasEdited && updatedLabel && (
              <span>
                {" · edited "}
                <time dateTime={review.updatedAt}>{updatedLabel}</time>
              </span>
            )}
          </p>
        )}
      </header>

      {review.comment && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </p>
      )}

      {showActions && (
        <div className="mt-5 border-t border-border pt-4">
          {confirmingDelete && onDelete ? (
            <div
              role="group"
              aria-label="Confirm delete"
              className="flex flex-wrap items-center gap-3"
            >
              <span className="text-sm text-foreground">Delete this review?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmingDelete(false);
                  onDelete(review);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(review)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit review
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete review
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/** Compact preview row used by the reviews skeleton. */
export function ReviewCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className="h-3.5 w-3.5 text-muted" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-11/12 rounded bg-muted" />
      </div>
    </div>
  );
}
