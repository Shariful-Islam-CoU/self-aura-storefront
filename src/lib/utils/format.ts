/**
 * Formatting helpers shared by storefront components.
 */

/** Format an amount as BDT currency (the brand's operating currency). */
export function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `৳${formatted}`;
}

/** Compact count, e.g. 1.2K - used for minimal stat lines. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Customer-friendly absolute date, e.g. "12 September 2026".
 *
 * Always paired with a `<time dateTime={iso}>` element by the caller, so the
 * machine-readable timestamp is preserved. An absolute date (rather than a
 * relative "2 days ago") is deliberate: it renders identically on the server
 * and the client, which avoids a hydration mismatch as reviews grow older.
 *
 * Returns an empty string for an invalid/missing timestamp - a review with a
 * broken date shows no date rather than "Invalid Date".
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** True when a timestamp differs from another by at least a minute. */
export function isMeaningfullyUpdated(iso: string, createdIso: string): boolean {
  const updated = new Date(iso).getTime();
  const created = new Date(createdIso).getTime();
  if (Number.isNaN(updated) || Number.isNaN(created)) return false;
  return updated - created >= 60_000;
}