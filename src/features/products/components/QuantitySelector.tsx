"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  onChange: (next: number) => void;
  /** Minimum selectable quantity (defaults to 1). */
  min?: number;
  /** Maximum selectable quantity, e.g. available stock. Unbounded when omitted. */
  max?: number;
  disabled?: boolean;
  id?: string;
}

/** Hard ceiling to keep values reasonable even without stock data. */
const HARD_MAX = 99;

/**
 * Reusable quantity stepper: [-] value [+].
 *
 * - clamps to [min, max ?? 99]
 * - never allows zero/negative values
 * - respects available stock when max is provided
 * - keyboard accessible with clear button names
 *
 * Reused by the future Cart module as-is.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  id,
}: QuantitySelectorProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < (max ?? HARD_MAX);

  const stepButtonClass =
    "flex h-12 w-12 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md border border-input bg-card",
        disabled && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        className={stepButtonClass}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        id={id}
        aria-live="polite"
        className="flex w-12 items-center justify-center text-sm font-medium tabular-nums text-foreground"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Increase quantity"
        className={stepButtonClass}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}