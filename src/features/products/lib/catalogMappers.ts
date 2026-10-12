import type {
  Category,
  CategoryResponse,
  CategoryThumbnailResponse,
  Product,
  ProductImage,
  ProductImageResponse,
  ProductResponse,
  ProductVideo,
  ProductVideoResponse,
} from "@/types";
import { normalizeOrder, resolveMediaUrl } from "./media";

/**
 * Adapters that map backend wire shapes to storefront display shapes.
 *
 * The backend returns each product image as `{ url, alt, sortOrder }` and each
 * video as `{ url, sortOrder, thumbnailUrl?, alt? }` — allow-lists with no
 * storage key, MIME type, byte size or server path — and the storefront UI
 * consumes `ProductImage[]` / `ProductVideo[]`, so these mappers bridge the two
 * and components never touch raw API shapes.
 *
 * The source is the PUBLIC customer catalogue, which already excludes cost
 * price, reorder thresholds and admin metadata, so nothing here needs to strip
 * those fields. A discount is never invented: the backend has no compare-at
 * price, so the adapter leaves `compareAtPrice` unset.
 */

/**
 * Canonical image list -> display list.
 *
 * Three things happen here, once, for every product:
 *   - entries are sorted by `sortOrder` and re-numbered densely, so position 0
 *     is unambiguously the primary image;
 *   - URLs are absolutized (Cloudinary delivery URLs pass through; a legacy
 *     root-relative `/media/<key>` is resolved against the API origin);
 *   - an image whose URL cannot be resolved is DROPPED rather than passed
 *     through, so an unrenderable entry can never become a broken card. The
 *     card and gallery fall back to their styled placeholder when the list
 *     ends up empty.
 */
export function mapProductImages(
  images: readonly ProductImageResponse[] | undefined | null,
  productName: string
): ProductImage[] {
  if (!images || images.length === 0) return [];

  const displayable = images
    .filter((image): image is ProductImageResponse => Boolean(image?.url))
    // An image whose URL cannot be resolved to a safe http(s)/root-relative URL
    // is DROPPED rather than passed through, so an unrenderable entry can never
    // become a broken card. The card and gallery show their styled placeholder
    // when the list ends up empty.
    .map((image) => ({ ...image, url: resolveMediaUrl(image.url) }))
    .filter((image): image is typeof image & { url: string } => image.url !== null);

  // Alt text is authored in the management app. If it is somehow blank, fall
  // back to the product name so a customer using a screen reader always hears
  // something meaningful instead of a bare "image".
  const described = displayable.map((image) => ({
    ...image,
    alt: image.alt?.trim() || `${productName} product image`,
  }));

  return normalizeOrder(described);
}

/**
 * Canonical video list -> display list.
 *
 * The same discipline as `mapProductImages`, with one difference that matters:
 * an unresolvable POSTER is not a reason to drop the video. The video URL is
 * what the customer actually watches, and a missing poster only costs a
 * decorative frame - so the video is kept and the poster simply omitted. An
 * unresolvable video URL does drop the entry, because a clip that cannot be
 * loaded cannot be offered at all.
 */
export function mapProductVideos(
  videos: readonly ProductVideoResponse[] | undefined | null,
  productName: string
): ProductVideo[] {
  if (!videos || videos.length === 0) return [];

  const playable = videos
    .filter((video): video is ProductVideoResponse => Boolean(video?.url))
    .map((video) => ({ ...video, url: resolveMediaUrl(video.url) }))
    .filter((video): video is typeof video & { url: string } => video.url !== null);

  return normalizeOrder(
    playable.map((video) => ({
      // Carried through untouched: it is what `normalizeOrder` sorts on, and
      // dropping it here would silently make every clip sort equal and leave
      // the gallery order at the wire order by accident rather than by rule.
      sortOrder: video.sortOrder,
      url: video.url,
      // The poster is optional and independently losable, so a failed resolve
      // yields `undefined` rather than removing the clip.
      thumbnailUrl: resolveMediaUrl(video.thumbnailUrl) ?? undefined,
      // Videos are primarily watched, not read, so a missing description is
      // normal; it still gets a sensible default for the gallery's label.
      alt: video.alt?.trim() || `${productName} product video`,
    }))
  );
}

export function mapProductResponse(item: ProductResponse): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    description: item.description,
    category: item.category,
    images: mapProductImages(item.images, item.name),
    videos: mapProductVideos(item.videos, item.name),
    sellingPrice: item.sellingPrice,
    stock: item.stock,
    lowStock: item.lowStock,
  };
}

/**
 * Category thumbnail -> display shape, or `undefined` when there is nothing to
 * show.
 *
 * Absence is normal, not an error: most categories will never get a thumbnail
 * and the tile falls back to its branded artwork. An unusable URL is treated
 * exactly like absence rather than being passed through, because a broken tile
 * is worse than a designed one.
 */
export function mapCategoryThumbnail(
  thumbnail: CategoryThumbnailResponse | undefined | null,
  categoryName: string
): Category["thumbnail"] {
  const url = resolveMediaUrl(thumbnail?.url);
  if (!url) return undefined;
  return {
    url,
    // Never empty. A tile image with an empty `alt` is announced as an
    // unlabelled image, which is worse for a customer than a slightly generic
    // description. The backend already substitutes the category name for a
    // legacy record with no stored alt; this is the same rule applied again
    // locally, so a hand-edited payload cannot produce a silent image.
    alt: thumbnail?.alt?.trim() || `${categoryName} collection`,
  };
}

export function mapCategoryBanner(
  banner: any | undefined | null,
  categoryName: string
): Category["banner"] {
  const url = resolveMediaUrl(banner?.url);
  if (!url) return undefined;
  return {
    url,
    alt: banner?.alt?.trim() || `${categoryName} banner`,
  };
}

export function mapCategoryResponse(category: CategoryResponse): Category {
  const { thumbnail: wire, banner: wireBanner, ...rest } = category as any;
  const thumbnail = mapCategoryThumbnail(wire, category.name);
  const banner = mapCategoryBanner(wireBanner, category.name);
  return {
    ...rest,
    ...(thumbnail ? { thumbnail } : {}),
    ...(banner ? { banner } : {}),
  };
}
