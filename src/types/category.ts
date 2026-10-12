/**
 * Category types for the storefront.
 *
 * `CategoryResponse` mirrors the wire shape of the public category endpoints
 * (`GET /api/catalogue/categories[... ]`), which return published categories
 * only. `Category` is the display type: the adapter resolves the optional
 * thumbnail to an absolute URL `next/image` can load.
 *
 * `thumbnail` is optional in BOTH layers, and that is deliberate rather than
 * incidental. The backend omits the key entirely for a category that has no
 * thumbnail, so the storefront branches on presence and renders its branded
 * tile instead of a broken image. Every thumbnail a customer can see therefore
 * has a real one behind it, and the fallback only ever appears because nobody
 * uploaded a picture yet.
 */

/** Wire shape of a category thumbnail: a delivery URL and a description. */
export interface CategoryThumbnailResponse {
  url: string;
  alt?: string;
}

export interface CategoryBannerResponse {
  url: string;
  alt?: string;
}

/** Storefront category thumbnail (adapter output). */
export interface CategoryThumbnail {
  url: string;
  alt?: string;
}

export interface CategoryBanner {
  url: string;
  alt?: string;
}

/** Wire shape: a published category as returned by the public API. */
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Omitted entirely when the category has no thumbnail. */
  thumbnail?: CategoryThumbnailResponse;
  banner?: CategoryBannerResponse;
}

/** Storefront category (adapter output). */
export interface Category extends Omit<CategoryResponse, "thumbnail" | "banner"> {
  /** Omitted when the category has no thumbnail, or the URL is unusable. */
  thumbnail?: CategoryThumbnail;
  banner?: CategoryBanner;
}
