"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { ProductImageFrame } from "./ProductImageFrame";
import { getAvailability } from "@/features/products/lib/availability";
import { getPrimaryImage } from "@/features/products/lib/media";
import { WishlistToggle } from "@/features/wishlist/components/WishlistToggle";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  /**
   * Marks the card as a layout preview rather than a real product. Shows a
   * "Preview" badge and uses abstract placeholder imagery.
   */
  demo?: boolean;
  /** Request eager loading of the image (used above the fold). */
  priority?: boolean;
  /**
   * Optional action rendered under the price (currently the wishlist page's
   * "Add to bag"). Left undefined everywhere else, so the card is unchanged.
   */
  footerAction?: React.ReactNode;
}

/**
 * Reusable product card.
 *
 * Shows the product's primary image — the canonical first entry of
 * `product.images`, where `sortOrder === 0`. There is no separate `isPrimary`
 * flag to fall out of sync with the list order.
 *
 * Videos are deliberately NOT played here. A grid of a dozen autoplaying clips
 * is unusable on a phone (they all fight for bandwidth, they eat data, and the
 * sound is unasked-for), and a `<video>` element cannot be scaled to a card
 * without either layout jump or a fixed-ratio letterbox. A small badge tells
 * the customer there is a clip on the detail page, and that is the whole job.
 *
 * The media box is `aspect-[4/5]` with a styled fallback and a loading
 * skeleton, so a missing or slow image causes no layout shift and never shows a
 * broken-image glyph. The URL is already absolute (the adapter resolved it
 * against the API origin, or passed a Cloudinary delivery URL through) and is
 * passed to `next/image` with a responsive `sizes` hint so the browser only
 * downloads the pixels it will paint.
 *
 * Interactive elements (wishlist, quick view) are DOM siblings of the product
 * link — nothing interactive is nested inside an anchor, so tapping the heart
 * never triggers navigation.
 */
export function ProductCard({ product, demo = false, priority = false, footerAction }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product.images);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100)
    : 0;
  const availability = getAvailability(product);
  const soldOut = availability === "out-of-stock";
  const lowStock = availability === "low-stock";
  const href = `/products/${product.slug}`;
  // A product with clips is worth flagging, and the count is what the customer
  // is actually choosing between ("one clip" vs "four clips").
  const videoCount = product.videos?.length ?? 0;
  // The authored description of the primary image, with a product-name
  // fallback. An empty `alt` would be announced as an unlabelled image, which
  // is worse than a slightly generic one.
  const imageAlt = primaryImage?.alt?.trim() || product.name;

  return (
    <li className="group">
      <article className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
        {/* Media. The frame reserves the 4/5 box, so the whole tile is one tap
            target with no layout shift; the link, badges and wishlist ride on
            top of it as siblings of the image rather than wrapping it. */}
        <ProductImageFrame
          src={primaryImage?.url}
          alt={imageAlt}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="aspect-[4/5]"
          imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          fallbackLabel={demo ? "Sample imagery" : "Image coming soon"}
        >
          <Link
            href={href}
            aria-label={`View ${product.name} details`}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="sr-only">{product.name}</span>
          </Link>

          {/* Badges - pointer-events-none so the product link stays tappable */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {demo && <Badge variant="accent">Preview</Badge>}
            {soldOut ? (
              <Badge variant="secondary">Sold out</Badge>
            ) : (
              <>
                {discount > 0 && <Badge variant="destructive">{discount}% off</Badge>}
                {lowStock && <Badge variant="warning">Low stock</Badge>}
              </>
            )}
          </div>

          {/* Clip indicator. Decorative (the accessible name of the link already
              carries the product name) and a sibling of the link, so it cannot
              swallow a tap. It is a hint, not a player. */}
          {!demo && videoCount > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground backdrop-blur"
            >
              <Film className="h-3 w-3" />
              {videoCount}
            </span>
          )}

          {/* Wishlist - sibling of the link (not nested), so it never navigates.
              Demo cards are placeholders with non-backend ids, so they are not
              wishlistable (saving one would never resolve to a real product). */}
          {!demo && (
            <WishlistToggle
              productId={product.id}
              productName={product.name}
              className="absolute right-3 top-3 z-20"
            />
          )}

          {/* Quick view - desktop hover/focus only (no hover-only behaviour on touch) */}
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-x-3 bottom-3 z-20 hidden translate-y-1.5 items-center justify-center rounded-md bg-background/90 px-3 py-2 text-xs font-label uppercase tracking-[0.12em] text-foreground opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:flex"
          >
            Quick view
          </Link>
        </ProductImageFrame>

        {/* Details */}
        <div className="mt-4 space-y-1.5">
          <p className="text-xs tracking-wide text-muted-foreground">{product.category.name}</p>
          <h3 className="text-sm font-medium leading-snug text-foreground">
            <Link
              href={href}
              className="line-clamp-1 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {product.name}
            </Link>
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(product.sellingPrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </p>
          {footerAction && <div className="pt-1">{footerAction}</div>}
        </div>
      </article>
    </li>
  );
}