"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import type { Review, ReviewReply } from "@/types/review";

export interface ReviewCardOwnActions {
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void | Promise<void>;
  onReply?: (review: Review, text: string) => void | Promise<void>;
}

interface ReviewCardProps extends ReviewCardOwnActions {
  review: Review;
  isLoggedIn: boolean;
}

export function ReviewCard({
  review,
  onEdit,
  onDelete,
  onReply,
  isLoggedIn,
}: ReviewCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | undefined>(undefined);
  const showActions = Boolean(onEdit || onDelete || (onReply && isLoggedIn));
  const wasEdited = review.updatedAt !== review.createdAt;
  const createdLabel = new Date(review.createdAt).toLocaleDateString();
  const updatedLabel = wasEdited ? new Date(review.updatedAt).toLocaleDateString() : "";

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !onReply) return;

    setReplySubmitting(true);
    setReplyError(undefined);
    try {
      await onReply(review, replyText.trim());
      setReplyText("");
      setShowReplyForm(false);
    } catch {
      setReplyError("Failed to post reply. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{review.authorName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating value={review.rating} size="sm" />
            <span className="sr-only">{review.rating} out of 5 stars</span>
            {review.isVerifiedPurchase && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                Verified Purchase
              </span>
            )}
            {review.isOwnReview && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">Your review</span>}
          </div>
        </div>

        {createdLabel && (
          <p className="shrink-0 text-xs text-gray-500">
            <time dateTime={review.createdAt}>{createdLabel}</time>
            {wasEdited && updatedLabel && (
              <span>
                {" - edited "}
                <time dateTime={review.updatedAt}>{updatedLabel}</time>
              </span>
            )}
          </p>
        )}
      </header>

      {review.comment && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-500">
          {review.comment}
        </p>
      )}

      {/* Replies thread. Admin replies are labelled as coming from Self Aura;
          customer replies carry the backend-supplied privacy-safe name. */}
      {review.replies.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-border pl-4">
          {review.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <textarea
              id={`reply-${review.id}`}
              placeholder="Write your reply..."
              rows={3}
              required
              maxLength={2000}
              value={replyText}
              disabled={replySubmitting}
              onChange={(event) => {
                setReplyText(event.target.value);
                if (replyError) setReplyError(undefined);
              }}
              className="w-full border border-gray-300 rounded p-2"
            />
            {replyError && <p className="text-sm text-red-600">{replyError}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyText("");
                  setShowReplyForm(false);
                }}
                disabled={replySubmitting}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replySubmitting || !replyText.trim()}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                {replySubmitting ? "Posting..." : "Post reply"}
              </button>
            </div>
          </div>
        </form>
      )}

      {showActions && (
        <div className="mt-5 border-t border-gray-200 pt-4">
          {confirmingDelete && onDelete ? (
            <div
              role="group"
              aria-label="Confirm delete"
              className="flex flex-wrap items-center gap-3"
            >
              <span className="text-sm text-gray-900">Delete this review?</span>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  // The parent records the failure; swallow the rejection here
                  // so a failed delete cannot become an unhandled rejection.
                  void Promise.resolve(onDelete(review)).catch(() => {});
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Edit review
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Delete review
                </button>
              )}
              {isLoggedIn && onReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  {showReplyForm ? "Cancel Reply" : "Reply"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ReplyItem({ reply }: { reply: ReviewReply }) {
  const created = reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : "";
  const isAdmin = reply.authorType === "admin";

  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-medium text-foreground">{reply.authorName}</p>
        {isAdmin && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">Self Aura Team</span>
        )}
        {created && (
          <time dateTime={reply.createdAt} className="text-xs text-muted-foreground">
            {created}
          </time>
        )}
      </div>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {reply.text}
      </p>
    </div>
  );
}

/** Compact preview row used by the reviews skeleton. */
export function ReviewCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="h-3.5 w-3.5 text-gray-300">★</span>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-11/12 rounded bg-gray-200" />
      </div>
    </div>
  );
}