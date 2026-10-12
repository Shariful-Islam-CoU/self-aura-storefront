import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Editorial hero — the single H1 on the page.
 *
 * Imagery is abstract placeholder art (scripts/generate-placeholders.ps1),
 * NOT a real Self Aura product or campaign photo. Swap the `src` in the
 * <Image> below for the real campaign asset; `hero-mobile.png` is available
 * for a tighter mobile crop if needed (a desktop-crop of hero-desktop.png is
 * used today via object-cover).
 */
export function HomeHero() {
  return (
    <section aria-label="Introduction" className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        {/* Copy */}
        <div className="max-w-xl">
          <p
            className="sa-animate-fade-up flex items-center gap-2 text-xs font-label uppercase tracking-[0.18em] text-accent"
            style={{ animationDelay: "0ms" }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            The Aura Edit — New Season
          </p>

          <h1
            className="sa-animate-fade-up font-display text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "90ms" }}
          >
            Discover Your Aura
          </h1>

          <p
            className="sa-animate-fade-up mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Curated fashion &amp; accessories for your everyday expression —
            pieces chosen to feel personal, considered, and lasting.
          </p>

          <div
            className="sa-animate-fade-up mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "270ms" }}
          >
            <Button asChild size="lg">
              <Link href="/shop">
                Shop the Collection
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/#new-arrivals">Explore New Arrivals</Link>
            </Button>
          </div>

          <p
            className="sa-animate-fade-up mt-8 text-xs text-muted-foreground"
            style={{ animationDelay: "360ms" }}
          >
            Seasonal edit · Preview catalogue
          </p>
        </div>

        {/* Visual */}
        <div className="sa-animate-fade-up relative" style={{ animationDelay: "200ms" }}>
          {/* Decorative offset frame */}
          <div
            aria-hidden="true"
            className="absolute -right-3 -top-3 h-full w-full rounded-lg border border-accent/30 sm:-right-4 sm:-top-4"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted shadow-lg">
            <Image
              src="/images/hero-desktop.png"
              alt="Self Aura editorial campaign — abstract placeholder"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">
            Campaign imagery preview — replaced when real Self Aura assets are ready
          </p>
        </div>
      </div>
    </section>
  );
}