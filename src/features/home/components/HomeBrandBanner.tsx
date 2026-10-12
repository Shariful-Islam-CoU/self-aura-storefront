import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

/**
 * Full-bleed promotional banner — also the "About / Our Story" anchor.
 * Copy is brand-oriented only; no claims about materials, quality or
 * guarantees are made. The artwork is an abstract placeholder.
 */
export function HomeBrandBanner() {
  return (
    <section id="story" aria-labelledby="story-heading" className="scroll-mt-24">
      <div className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden sm:min-h-[480px]">
        <Image
          src="/images/banner-desktop.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          aria-hidden="true"
        />
        {/* Readability scrim - adapts to theme via background tokens */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-background/90"
        />

        <Container className="relative py-16 text-center">
          <Reveal>
            <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">Made for everyday</p>
            <h2 id="story-heading" className="mx-auto mt-3 max-w-2xl font-display text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Everyday Elegance
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Pieces chosen to make your everyday moments feel special.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/shop">Explore the Collection</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}