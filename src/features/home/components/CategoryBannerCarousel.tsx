'use client';

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types";

const HOMEPAGE_CATEGORY_SLIDE_INTERVAL = 5000;
const TRANSITION_DURATION = 800;

export interface CategoryBannerCarouselProps {
  categories: Category[];
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);

    const handleChange = () => {
      setPrefersReducedMotion(query.matches);
    };

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
    } else if (typeof (query as any).addListener === "function") {
      (query as any).addListener(handleChange);
    }

    return () => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", handleChange);
      } else if (typeof (query as any).removeListener === "function") {
        (query as any).removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

export function CategoryBannerCarousel({ categories }: CategoryBannerCarouselProps) {
  const bannerCategories = useMemo(
    () => categories.filter((category) => category.banner?.url),
    [categories]
  );

  const totalSlides = bannerCategories.length;
  const prefersReducedMotion = usePrefersReducedMotion();

  const slides = useMemo(() => {
    if (totalSlides === 0) return [];
    if (totalSlides === 1) return bannerCategories;
    const first = bannerCategories[0];
    const last = bannerCategories[totalSlides - 1];
    return [last, ...bannerCategories, first];
  }, [bannerCategories, totalSlides]);

  const [currentIndex, setCurrentIndex] = useState(totalSlides > 1 ? 1 : 0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToNext = useCallback(() => {
    if (totalSlides <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalSlides, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (totalSlides <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [totalSlides, isTransitioning]);

  const goToSlide = useCallback(
    (index: number) => {
      if (totalSlides <= 1 || isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index + 1);
    },
    [totalSlides, isTransitioning]
  );

  useEffect(() => {
    if (totalSlides <= 1) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex(1);
    setIsTransitioning(false);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;

    if (currentIndex === slides.length - 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, TRANSITION_DURATION);
      transitionTimeoutRef.current = timeout;
      return () => clearTimeout(timeout);
    }

    if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(slides.length - 2);
      }, TRANSITION_DURATION);
      transitionTimeoutRef.current = timeout;
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
    transitionTimeoutRef.current = timeout;
    return () => clearTimeout(timeout);
  }, [currentIndex, totalSlides, slides.length]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (totalSlides <= 1 || isPaused || prefersReducedMotion) {
      return;
    }

    timerRef.current = setTimeout(() => {
      goToNext();
    }, HOMEPAGE_CATEGORY_SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, totalSlides, isPaused, prefersReducedMotion, goToNext]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);
  const handleTouchStart = useCallback(() => setIsPaused(true), []);
  const handleTouchEnd = useCallback(() => setIsPaused(false), []);

  if (totalSlides === 0) {
    return (
      <section aria-label="Introduction" className="relative flex h-[70vh] min-h-[420px] items-center justify-center overflow-hidden border-b border-border bg-background sm:min-h-[520px] lg:h-[85vh]">
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="flex items-center justify-center gap-2 text-xs font-label uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            The Aura Edit
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover Your Aura
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Curated fashion &amp; accessories for your everyday expression.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/shop">
                Explore Shop
                <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const currentCategoryIndex = totalSlides === 1 ? 0 : ((currentIndex - 1 + totalSlides) % totalSlides);
  const currentCategory = bannerCategories[currentCategoryIndex];
  const ctaText = currentCategory ? `Shop ${currentCategory.name}` : "Explore Shop";

  const trackTransform = prefersReducedMotion
    ? "translateX(0)"
    : `translateX(-${currentIndex * 100}%)`;

  const trackTransition = prefersReducedMotion
    ? "none"
    : isTransitioning
      ? `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
      : "none";

  return (
    <section
      aria-label="Featured categories"
      className="relative h-[70vh] min-h-[420px] w-full overflow-hidden border-b border-border bg-black sm:min-h-[520px] lg:h-[85vh]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0">
        <div
          className="flex h-full w-full"
          style={{
            transform: trackTransform,
            transition: trackTransition,
            willChange: "transform",
          }}
        >
          {slides.map((category, index) => {
            const banner = category.banner;
            if (!banner?.url) return null;
            return (
              <div key={`${category.id}-${index}`} className="relative h-full w-full flex-shrink-0">
                <Image
                  src={banner.url}
                  alt={banner.alt || `${category.name} banner`}
                  fill
                  priority={index === 0 || index === 1}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex h-full items-center">
        <div className="pointer-events-auto mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8 lg:items-start lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <p className="flex items-center gap-2 text-xs font-label uppercase tracking-[0.18em] text-white/90 drop-shadow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Self Aura
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
              Style that feels like you
            </h1>
            {currentCategory && (
              <p className="mt-4 text-sm font-medium uppercase tracking-wide text-white/95 drop-shadow sm:text-base">
                {currentCategory.name}
              </p>
            )}
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/90 drop-shadow sm:text-lg">
              Discover a curated edit of fashion and jewelry designed to complement your aura.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Button asChild size="lg" className="shadow-lg">
                <Link href={currentCategory ? `/categories/${currentCategory.slug}` : "/shop"}>
                  {ctaText}
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white shadow-md backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80 sm:left-6"
            aria-label="Previous category banner"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white shadow-md backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80 sm:right-6"
            aria-label="Next category banner"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 shadow backdrop-blur sm:bottom-8">
            {bannerCategories.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/80 ${
                  index === currentCategoryIndex
                    ? "scale-110 bg-white"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentCategoryIndex}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}