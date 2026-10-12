"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_MAX, RATING_VALUE_LABELS } from "../constants";

/**
 * One star with a fractional fill (0..1).
 *
 * Filled and empty glyphs are stacked; the filled one is clipped from the left
 * by the fill fraction. This is what lets a 4.7 average render as four full
 * stars plus a 70%-filled fifth instead of a misleading whole-star rounding.
 */
function StarGlyph({ fill, className }: { fill: number; className?: string }) {
  const clamped = Math.min(1, Math.max(0, fill));

  return (
    <span className={cn("relative inline-flex", className)} aria-hidden="true">
      <Star className="h-full w-full text-muted-foreground/40" />
      {clamped > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${(1 - clamped) * 100}% 0 0)` }}
        >
          <Star className="h-full w-full fill-current text-accent" />
        </span>
      )}
    </span>
  );
}

interface ReadOnlyRatingProps {
  value: number;
  /** Pixel size of each star. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

function ReadOnlyRating({ value, size = "md", className }: ReadOnlyRatingProps) {
  const safeValue = Number.isFinite(value) ? Math.min(RATING_MAX, Math.max(0, value)) : 0;
  const rounded = Math.round(safeValue * 10) / 10;
  const full = Math.floor(safeValue);
  const remainder = safeValue - full;

  // A whole-number value leaves no half star to draw; a fractional one draws a
  // partially filled star in the (full + 1)th position.
  const fractional = remainder > 0.05;

  return (
    <span
      role="img"
      aria-label={`${rounded} out of ${RATING_MAX} stars`}
      className={cn("inline-flex items-center gap-0.5 text-accent", className)}
    >
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const starNumber = index + 1;
        const fill =
          starNumber <= full ? 1 : fractional && starNumber === full + 1 ? remainder : 0;
        return <StarGlyph key={starNumber} fill={fill} className={SIZE_CLASSES[size]} />;
      })}
    </span>
  );
}

interface InteractiveRatingProps {
  /** Current rating, or 0 when nothing is chosen yet. */
  value: number;
  onChange: (value: number) => void;
  /** Visually hides the "Rating" label but keeps it for screen readers. */
  label?: string;
  /** Marks the control invalid and wires up the error message. */
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Interactive 1..5 star input.
 *
 * Accessibility: this is a real radio group, so screen readers announce
 * "rating, 4 of 5, selected" and arrow keys / space move between stars with
 * no custom key handling. Each star keeps a visible focus ring, and the group
 * is labelled. The chosen state is conveyed by the filled glyph AND the
 * radio's checked semantics, never by colour alone.
 */
function InteractiveRating({
  value,
  onChange,
  label = "Rating",
  describedBy,
  invalid = false,
  disabled = false,
  size = "lg",
  className,
}: InteractiveRatingProps) {
  const groupId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  // While hovering, preview the candidate value; fall back to the real value.
  const preview = hovered ?? value;

  return (
    <fieldset
      className={cn("min-w-0", className)}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onMouseLeave={() => setHovered(null)}
    >
      <legend className="text-sm font-label text-foreground">{label}</legend>

      <div className="mt-2 flex items-center gap-1" role="presentation">
        {Array.from({ length: RATING_MAX }, (_, index) => {
          const starNumber = index + 1;
          const isPreviewed = starNumber <= preview;
          return (
            <label
              key={starNumber}
              className={cn(
                "relative inline-flex cursor-pointer items-center rounded-sm p-0.5",
                "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onMouseEnter={() => setHovered(starNumber)}
            >
              <input
                type="radio"
                name={`${groupId}-rating`}
                value={starNumber}
                checked={value === starNumber}
                onChange={() => onChange(starNumber)}
                disabled={disabled}
                // Each radio carries the full context, so a screen reader
                // reads "4 stars, 4 of 5" without extra wiring.
                aria-label={RATING_VALUE_LABELS[starNumber]}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <StarGlyph
                fill={isPreviewed ? 1 : 0}
                className={cn(SIZE_CLASSES[size], "transition-transform duration-150", isPreviewed && "scale-105")}
              />
            </label>
          );
        })}

        {/* Live value read-out: the accessible text required next to the stars. */}
        <span aria-live="polite" className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value} out of ${RATING_MAX}` : `Not rated`}
        </span>
      </div>
    </fieldset>
  );
}

export interface StarRatingProps {
  /**
   * Read-only when omitted; interactive when an `onChange` handler is given.
   * One component, two modes, so a rating always looks identical.
   */
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  label,
  describedBy,
  invalid,
  disabled,
  className,
}: StarRatingProps) {
  if (onChange) {
    return (
      <InteractiveRating
        value={value}
        onChange={onChange}
        size={size}
        label={label}
        describedBy={describedBy}
        invalid={invalid}
        disabled={disabled}
        className={className}
      />
    );
  }

  return <ReadOnlyRating value={value} size={size} className={className} />;
}
