"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductImageFrame } from "./ProductImageFrame";
import type { ProductVideo } from "@/types";

export interface ProductVideoFrameProps {
  video: ProductVideo;
  /** Product name, used to label the player when the clip has no description. */
  name: string;
  aspectRatio?: string;
  /** Responsive `sizes` hint for the poster. Always pass one. */
  sizes: string;
  className?: string;
  /** Overlay content (arrows, badges) painted above the player. */
  children?: React.ReactNode;
}

/**
 * Asks an element to start playing, and never lets the request become noise.
 *
 * `HTMLMediaElement.play()` returns a promise that rejects for entirely routine
 * reasons: an autoplay policy, the customer switching tabs mid-click, a codec
 * the browser will not take, or the element being unmounted the instant they
 * pressed play. None of those are bugs, and an unhandled rejection would show up
 * as a console error for something the customer deliberately asked for — so the
 * result is swallowed and the poster simply stays up.
 *
 * The return value is deliberately not chained with `.catch()`: older jsdom
 * builds and a few embedded webviews return `undefined` rather than a promise,
 * and `void undefined.catch()` would throw a *new* TypeError in exactly the
 * place this helper exists to keep quiet.
 */
function requestPlay(element: HTMLMediaElement | null): void {
  if (!element) return;
  try {
    const played = element.play() as Promise<void> | undefined;
    if (played && typeof played.catch === "function") played.catch(() => undefined);
  } catch {
    // A synchronous throw from `play()` is the same class of problem.
  }
}

/**
 * A product clip, framed like every other media box on the site.
 *
 * Guarantees, for a customer's benefit:
 *   - **Nothing autoplays.** The player is not mounted until the customer
 *     presses play. A shop that starts making noise on its own loses the
 *     visitor, and there is no `autoPlay` attribute anywhere in this file.
 *   - **The poster costs an image request, not a video one.** The still comes
 *     from Cloudinary through `next/image` and is resized like any other image,
 *     so a 64px thumbnail never pulls a multi-megabyte MP4.
 *   - **No layout shift:** the box is sized by `aspectRatio` before any bytes
 *     arrive, and the same skeleton sits in it as for a photo.
 *   - **Graceful degradation:** a clip with no poster, or a poster that fails,
 *     shows the shared styled fallback behind the play button rather than a
 *     broken-image glyph, and the clip is still playable.
 *   - **Controls are always visible.** A browser's default control bar
 *     disappears on idle and is easy to lose on touch; an explicit play/pause
 *     button cannot.
 *
 * A plain `<video>` is correct here and is not a `next/image` case: the Next
 * image pipeline does not handle video, and Cloudinary already serves an
 * optimised, browser-compatible MP4 (the backend requests `f_mp4` when it builds
 * the delivery URL), so no client-side format sniffing is needed.
 */
export function ProductVideoFrame({
  video,
  name,
  aspectRatio,
  sizes,
  className,
  children,
}: ProductVideoFrameProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const description = video.alt?.trim() || `${name} product video`;

  /**
   * Begins playback because the customer asked for it.
   *
   * `play()` is requested from the ref callback rather than the click handler,
   * because the `<video>` element does not exist until React commits the state
   * change. It can also reject (autoplay policy, an unmount mid-click, a codec
   * the browser will not take), and an unhandled rejection would surface as a
   * console error for something the customer deliberately did, so it is caught
   * and the poster simply stays up.
   */
  const start = () => {
    setHasStarted(true);
    requestPlay(videoRef.current);
  };

  return (
    <div
      className={cn("relative overflow-hidden border border-border bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {hasStarted ? (
        <video
          ref={(element) => {
            videoRef.current = element;
            // Fires on mount, which for this element is always after an
            // explicit press of the play button.
            requestPlay(element);
          }}
          src={video.url}
          poster={video.thumbnailUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full bg-black object-contain"
          aria-label={description}
        >
          {/*
            A customer whose browser cannot play this codec still gets the clip,
            as a plain link, rather than an empty black box.
          */}
          <p className="p-4 text-center text-sm text-muted-foreground">
            Your browser cannot play this video.{" "}
            <a
              href={video.url}
              className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Download it instead
            </a>
            .
          </p>
        </video>
      ) : (
        <>
          {/* The poster is a still image, so it goes through next/image and
              costs a thumbnail-sized request. */}
          <ProductImageFrame
            src={video.thumbnailUrl ?? null}
            alt=""
            aspectRatio={aspectRatio}
            sizes={sizes}
            className="h-full w-full border-0"
            rounded="rounded-none"
            fallbackLabel="Video"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={start}
              aria-label={`Play ${description}`}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white backdrop-blur transition-transform hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:scale-95"
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {children}
    </div>
  );
}
