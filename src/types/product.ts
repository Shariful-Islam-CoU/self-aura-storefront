/**
 * Product types for the storefront.
 *
 * Two layers, both scoped to the PUBLIC customer catalogue the backend serves
 * from `GET /api/catalogue/*`:
 *
 * - `ProductResponse` — the exact wire shape of a public product.
 * - `Product` — the display shape consumed by UI components. A service adapter
 *   maps `ProductResponse` -> `Product` (image URLs are absolutized so they
 *   resolve against the API origin, and the list is kept in canonical order).
 *
 * The public catalogue is an allow-list, so these types carry no internal
 * fields: there is no `costPrice`, no `lowStockThreshold` (the backend sends a
 * derived `lowStock` boolean instead), no `isActive` (every published product
 * is returned as active by definition) and no admin/audit metadata. Fields the
 * backend does not model yet - notably `compareAtPrice` - stay optional and are
 * never fabricated by the adapter.
 */

/** Minimal category reference embedded in a product payload. */
export interface ProductCategoryRef {
  id: string;
  name?: string;
  slug?: string;
}

/** Display image for a product card/detail (adapter output). */
export interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
}

/**
 * Wire shape of one image inside a public product payload.
 *
 * This is an allow-list: the backend's public catalogue mapper emits exactly
 * these three fields. There is deliberately no storage key, MIME type, pixel
 * dimensions or filesystem path in a customer-facing response - nothing a
 * customer could use to infer where the file lives on the server.
 */
export interface ProductImageResponse {
  url: string;
  alt: string;
  sortOrder: number;
}

/**
 * Wire shape of one video inside a public product payload.
 *
 * Same allow-list discipline as `ProductImageResponse`: `url` is a derived MP4
 * delivery URL, `thumbnailUrl` a Cloudinary poster frame. The Cloudinary
 * `publicId`, `resourceType`, byte size and container format are never sent.
 */
export interface ProductVideoResponse {
  url: string;
  sortOrder: number;
  /** Poster frame derived by the backend; absent for a legacy record. */
  thumbnailUrl?: string;
  alt?: string;
}

/** Display video for the product gallery (adapter output). */
export interface ProductVideo {
  url: string;
  sortOrder: number;
  thumbnailUrl?: string;
  alt?: string;
}

/** Wire shape: a single product as returned by the public catalogue API. */
export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: ProductCategoryRef;
  /**
   * Ordered image list. `sortOrder: 0` is the primary image - the storefront has
   * a single definition of "primary" (position 0) that cannot fall out of sync
   * with a separate flag.
   */
  images: ProductImageResponse[];
  /**
   * Ordered video list. The backend always sends an array - a product with no
   * video is a normal state, not an error - so the adapter stays branch-free.
   */
  videos: ProductVideoResponse[];
  sellingPrice: number;
  stock: number;
  /** Backend-derived urgency flag. The reorder threshold is never exposed. */
  lowStock: boolean;
}

/** Wire shape: the paged product list payload. */
export interface ProductListResponse {
  items: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Storefront product (adapter output). */
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: ProductCategoryRef;
  images: ProductImage[];
  videos: ProductVideo[];
  sellingPrice: number;
  compareAtPrice?: number;
  stock: number;
  lowStock: boolean;
}
