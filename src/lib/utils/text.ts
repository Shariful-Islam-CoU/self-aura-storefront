/** Small text helpers shared by storefront pages. */

/** "sample-piece-01" -> "Sample Piece 01" */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}