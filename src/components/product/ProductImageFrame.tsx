"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { ProductImageFallback } from "./ProductImageFallback";

export interface ProductImageFrameProps {
  /** Absolute URL from `resolveMediaUrl`, or `null` when there is no image. */
  src: string | null | undefined;
  /** Accessible description. Pass `""` for a purely decorative thumbnail. */
  alt: string;
  /** CSS aspect ratio for the reserved box, e.g. `"4 / 5"`. */
  aspectRatio?: string;
  /** Responsive `sizes` hint. Always pass one - it decides the served size. */
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** Above-the-fold images should be eager and preloaded. */
  priority?: boolean;
  fallbackLabel?: string;
  /** Border radius of the reserved box. */
  rounded?: string;
  /** Fired once per `src` when the bytes arrive, for a parent's own state. */
  onLoad?: () => void;
  /**
   * Overlay content (links, badges, controls) rendered inside the box, above
   * the image. Callers position it with `absolute inset-*`; the frame does not
   * restyle it. Rendered after the image so it always paints on top.
   */
  children?: React.ReactNode;
}

/**
 * Image box that never shifts layout and never shows a broken-image glyph.
 *
 * Guarantees for every product surface (grid card, related-products rail, cart
 * line, gallery frame):
 *   - no layout shift: the box is sized by `aspectRatio` before any bytes load,
 *     and a skeleton sits in it, so the card does not jump when the photo lands;
 *   - graceful degradation: a failed load swaps to the styled fallback, and a
 *     missing `src` renders the same fallback immediately;
 *   - one code path, so a card, a cart line and a gallery thumb all degrade
 *     identically instead of each inventing its own broken state.
 */
export function ProductImageFrame({
  src,
  alt,
  aspectRatio,
  sizes,
  className,
  imageClassName,
  priority = false,
  fallbackLabel,
  rounded = "rounded-lg",
  onLoad,
  children,
}: ProductImageFrameProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    src ? "loading" : "failed"
  );

  // A new `src` restarts the cycle. Without this, a "failed" state from a
  // previous product would persist and keep hiding a now-valid image.
  const [previousSrc, setPreviousSrc] = useState(src);
  if (previousSrc !== src) {
    setPreviousSrc(src);
    setStatus(src ? "loading" : "failed");
  }

  const isBroken = !src || status === "failed";

  return (
    <div
      className={cn("relative overflow-hidden border border-border bg-muted", rounded, className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {isBroken ? (
        <ProductImageFallback label={fallbackLabel} />
      ) : (
        <>
          {status === "loading" && (
            <div
              aria-hidden="true"
              data-testid="product-image-loading"
              className="absolute inset-0 animate-pulse bg-muted"
            />
          )}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => {
              setStatus("loaded");
              onLoad?.();
            }}
            onError={() => setStatus("failed")}
            className={cn(
              "object-cover transition-opacity duration-500 ease-out",
              status === "loaded" ? "opacity-100" : "opacity-0",
              imageClassName
            )}
          />
        </>
      )}
      {children}
    </div>
  );
}
