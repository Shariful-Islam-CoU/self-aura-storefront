import { siteConfig } from "@/lib/config/env";
import type { ProductImage, ProductVideo } from "@/types";

/**
 * Product-media helpers for the storefront.
 *
 * Three things have to be true for every product image and video, and none is
 * obvious at the call site, so all three live here:
 *
 * 1. The URL has to be absolute. New media is delivered from Cloudinary over
 *    absolute `https://res.cloudinary.com/...` URLs, but this app runs on a
 *    different origin from the API (`:3001` vs `:5000`) and `next/image`
 *    resolves a root-relative `src` against the *storefront* origin. Products
 *    uploaded before the Cloudinary migration still hold `/media/<key>` paths,
 *    and those have to keep rendering, so a root-relative URL is resolved
 *    against the API origin rather than being dropped.
 * 2. The list has to be in canonical order, because position 0 IS the primary
 *    image. There is no separate `isPrimary` flag anywhere in the system, so
 *    order and "primary" can never disagree.
 * 3. The poster frame is optional. A video stored before posters existed has
 *    none, and the gallery then draws its own tile rather than a broken image.
 */

/** Origin of the backend API, e.g. `http://localhost:5000` from `.../api`. */
function apiOrigin(): string | null {
  try {
    return new URL(siteConfig.apiUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Turns a stored image URL into an absolute URL `next/image` can load.
 *
 * Absolute `http(s)` URLs pass through untouched. Root-relative URLs are
 * resolved against the API origin. Anything else - a protocol-relative URL
 * (`//evil.example/x`), a `javascript:` URL, junk - returns `null` so callers
 * render the styled fallback instead of a broken image.
 */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (value.length === 0) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null;
    } catch {
      return null;
    }
  }

  // Protocol-relative would silently resolve to another origin.
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  const origin = apiOrigin();
  return origin ? `${origin}${value}` : value;
}

/** The primary image: the entry with the lowest `sortOrder`. */
export function getPrimaryImage(
  images: readonly ProductImage[] | undefined | null
): ProductImage | undefined {
  if (!images || images.length === 0) return undefined;
  return images.reduce(
    (best, image) => (image.sortOrder < best.sortOrder ? image : best),
    images[0]
  );
}

/**
 * Sorts into canonical order and re-numbers `sortOrder` densely from 0.
 *
 * The API already returns a dense, ordered list; this makes the invariant local
 * so a card or gallery can never render "image 1" after "image 3" because of a
 * stray payload. Generic over the ordered element so images and videos share
 * the rule instead of each keeping a near-identical copy.
 */
export function normalizeOrder<T extends { sortOrder: number }>(
  items: readonly T[]
): T[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

/**
 * One entry in the storefront's product gallery.
 *
 * Images and videos are two separate ordered lists on the wire (a video is not
 * an image, and the card must never pick a video as its tile), but a gallery is
 * one sequence the customer pages through. This is the joined form, with images
 * ahead of videos so the gallery always opens on the primary IMAGE - the card
 * image and the first gallery view agree, which is what makes a product
 * recognisable between the grid and the detail page.
 */
export type GalleryItem =
  | { kind: "image"; image: ProductImage }
  | { kind: "video"; video: ProductVideo };

/**
 * The gallery sequence: canonical images, then canonical videos.
 *
 * Order is decided here, once, rather than in the gallery component - so the
 * ordering is a testable data rule and the component only has to render it.
 *
 * Entries with no loadable URL are dropped. The adapters already filter these
 * out, so in practice this is belt-and-braces for a payload that reached the
 * component some other way: a gallery tile that can never open is worse than a
 * tile that is not there, because the customer clicks it and nothing happens.
 */
export function buildGalleryItems(
  images: readonly ProductImage[] | undefined | null,
  videos: readonly ProductVideo[] | undefined | null
): GalleryItem[] {
  const orderedImages = normalizeOrder(images ?? [])
    .filter((image) => Boolean(image?.url))
    .map((image) => ({ kind: "image" as const, image }));
  const orderedVideos = normalizeOrder(videos ?? [])
    .filter((video) => Boolean(video?.url))
    .map((video) => ({ kind: "video" as const, video }));
  return [...orderedImages, ...orderedVideos];
}
