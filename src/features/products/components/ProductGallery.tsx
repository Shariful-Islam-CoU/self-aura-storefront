"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { ProductVideoFrame } from "@/components/product/ProductVideoFrame";
import { buildGalleryItems, type GalleryItem } from "@/features/products/lib/media";
import type { ProductImage, ProductVideo } from "@/types";

interface ProductGalleryProps {
  images: ProductImage[];
  videos?: ProductVideo[];
  name: string;
}

/**
 * Interactive product media gallery — images and videos in one sequence.
 *
 * - Desktop: vertical thumbnail rail on the left, large main view right.
 * - Mobile/tablet: main view first, horizontally scrollable thumbnail strip
 *   below (no awkward overflow).
 * - One item total: prev/next and the thumbnail rail are omitted — there is
 *   nothing to navigate.
 * - Nothing at all, or a file that fails to load: the shared styled fallback,
 *   not a broken-image glyph.
 *
 * Ordering
 * --------
 * The sequence is built by `buildGalleryItems`: canonical images first, then
 * canonical videos. Images lead deliberately, so the gallery opens on the same
 * picture the product card shows. A customer who recognises a tile in the grid
 * and lands on the detail page is looking at that tile, not a video.
 *
 * Within each list the backend's `sortOrder` decides, densely re-numbered from
 * zero. Videos are never reordered against images by the customer — ordering is
 * a merchandising decision made in the management app, and the gallery is a
 * faithful view of it.
 *
 * Video playback
 * --------------
 * A `<video>` element is mounted ONLY for the item the customer has actively
 * selected, and only once they press play. Nothing autoplays and nothing is
 * ever `muted`-and-playing: a shop that ambushes a visitor with sound is a shop
 * a visitor leaves. The poster frame (a Cloudinary still, requested through
 * `next/image`) is what is painted before then, so the grid of thumbnails stays
 * cheap — no video bytes are fetched to draw a 64px tile.
 *
 * Accessibility
 * -------------
 * The main view is a labelled region that announces its own alt text, authored
 * in the management app. The thumbnail rail is a `tablist` whose options are
 * real buttons, so it is reachable and operable with Tab/Enter/Space. Arrow
 * keys, Home and End move between items, and the arrows are large enough to tap
 * on a phone. Prev/next wrap around, so a customer can never get stuck on the
 * last item.
 *
 * Selecting a different item changes the main view only — it does not rewrite
 * the product's primary image (that is a management-app action).
 */
export function ProductGallery({ images, videos, name }: ProductGalleryProps) {
  const items = buildGalleryItems(images, videos);
  const [activeIndex, setActiveIndex] = useState(0);

  // Guard against the list shrinking under us (e.g. a refresh that drops an
  // image) so the main view can never point past the end of the array.
  const safeIndex = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const active = items[safeIndex];
  const isSingle = items.length === 1;

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      // Wrap: next past the last item returns to the first, and vice versa.
      setActiveIndex(((next % items.length) + items.length) % items.length);
    },
    [items.length]
  );

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Arrow keys while a thumbnail has focus follow the standard tablist pattern:
   * move the selection AND move focus with it, so a keyboard user never ends up
   * focused on an element that is no longer the selected one. Propagation is
   * stopped so the container handler does not advance a second time.
   */
  const handleThumbKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = Math.min(index + 1, items.length - 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = Math.max(index - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (next === index) return;
    setActiveIndex(next);
    thumbRefs.current[next]?.focus();
  };

  /**
   * Arrow keys / Home / End page the gallery.
   *
   * Bound to the gallery container rather than `document`, and React's
   * `onKeyDown` only fires from a focused descendant - so this never hijacks
   * page scrolling, and it only applies while the customer is actually inside
   * the gallery (a thumbnail or arrow button has focus).
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isSingle || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    switch (event.key) {
      case "ArrowRight":
        goNext();
        break;
      case "ArrowLeft":
        goPrev();
        break;
      case "Home":
        goTo(0);
        break;
      case "End":
        goTo(items.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  if (items.length === 0) {
    return (
      <ProductImageFrame
        src={null}
        alt={`${name} - no image available`}
        aspectRatio="4 / 5"
        sizes="(min-width: 1024px) 50vw, 100vw"
        fallbackLabel="Image coming soon"
      />
    );
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className={cn("flex gap-3 lg:gap-4", isSingle ? "" : "flex-col-reverse lg:flex-row")}
    >
      {/* Thumbnails - only when there is more than one item */}
      {!isSingle && (
        <div
          role="tablist"
          aria-label={`${name} media`}
          aria-orientation="horizontal"
          className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {items.map((item, index) => {
            const isActive = index === safeIndex;
            const isVideo = item.kind === "video";
            return (
              <button
                key={`${itemKey(item)}-${index}`}
                type="button"
                role="tab"
                ref={(el) => {
                  thumbRefs.current[index] = el;
                }}
                // Roving tabindex: the active thumb is the single tab stop, arrow
                // keys move between them. This is the standard tablist pattern
                // and keeps a 15-item gallery from adding 15 tab stops.
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleThumbKeyDown(index, event)}
                // The label says WHAT it is, not just its position: a rail of
                // "View item 3 of 7" is useless to a screen-reader user, who
                // cannot see which ones are video.
                aria-label={`View ${isVideo ? "video" : "image"} ${index + 1} of ${items.length}`}
                aria-selected={isActive}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-md border bg-muted transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive ? "border-accent" : "border-border hover:border-accent/50"
                )}
              >
                <ProductImageFrame
                  src={isVideo ? item.video.thumbnailUrl : item.image.url}
                  alt=""
                  sizes="64px"
                  rounded="rounded-none"
                  className="h-full w-full border-0"
                  fallbackLabel="—"
                />
                {isVideo && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <Play className="h-5 w-5 fill-white text-white drop-shadow" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main view. Not focusable itself: the container owns the key handling
          and every control inside it is already a tab stop, so adding a
          focusable region here would only add a keyboard trap. */}
      <div className="group/gallery relative aspect-[4/5] flex-1 lg:self-start">
        {active?.kind === "video" ? (
          <ProductVideoFrame
            key={active.video.url}
            video={active.video}
            name={name}
            aspectRatio="4 / 5"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full"
          >
            {!isSingle && <GalleryArrows goPrev={goPrev} goNext={goNext} position={safeIndex} total={items.length} />}
          </ProductVideoFrame>
        ) : (
          <ProductImageFrame
            key={active?.image.url}
            src={active?.image.url}
            alt={active?.image.alt || `${name} product image`}
            aspectRatio="4 / 5"
            sizes="(min-width: 1024px) 50vw, 100vw"
            // The first item is the primary image and is the LCP element, so it
            // is eager. Every other item swaps in on click and loads then.
            priority={safeIndex === 0}
            imageClassName="sa-animate-fade-in"
            fallbackLabel="Image unavailable"
            rounded="rounded-lg"
            className="h-full w-full"
          >
            {!isSingle && <GalleryArrows goPrev={goPrev} goNext={goNext} position={safeIndex} total={items.length} />}
          </ProductImageFrame>
        )}
      </div>
    </div>
  );
}

/** A stable React key / identity for a gallery entry. */
function itemKey(item: GalleryItem): string {
  return item.kind === "image" ? `image:${item.image.url}` : `video:${item.video.url}`;
}

/**
 * Prev/next arrows and the position counter, shared by the image and video
 * frames.
 *
 * Extracted so both branches paint identically — a control that moved or
 * disappeared when the customer paged onto a video would read as a bug.
 */
function GalleryArrows({
  goPrev,
  goNext,
  position,
  total,
}: {
  goPrev: () => void;
  goNext: () => void;
  position: number;
  total: number;
}) {
  return (
    <>
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground opacity-100 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:opacity-0 sm:group-hover/gallery:opacity-100 sm:group-focus-within/gallery:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next image"
        className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground opacity-100 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:opacity-0 sm:group-hover/gallery:opacity-100 sm:group-focus-within/gallery:opacity-100"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-background/80 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground backdrop-blur"
      >
        {position + 1} / {total}
      </p>
    </>
  );
}
