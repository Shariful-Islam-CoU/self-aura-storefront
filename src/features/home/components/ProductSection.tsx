import Link from "next/link";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types";

interface ProductSectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
  /** Flag demo catalogue items with a "Preview" badge. */
  demo?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  /** Extra classes for the <section> (e.g. alternating background). */
  className?: string;
}

/**
 * Reusable "collection" section: heading + product grid + optional CTA.
 *
 * Adapter seam: `products` is a plain `Product[]`, so swapping the local demo
 * data for `GET /products?sort=...` data later requires no UI changes.
 */
export function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  demo = false,
  ctaLabel,
  ctaHref,
  className,
}: ProductSectionProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-24 py-16 sm:py-24", className)}
    >
      <Container>
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              {eyebrow && (
                <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
              )}
              <h2 id={headingId} className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
              {description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
            </div>
            {ctaLabel && ctaHref && (
              <Button asChild variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            )}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10">
            <ProductGrid products={products} demo={demo} />
          </div>
        </Reveal>

        {ctaLabel && ctaHref && (
          <Reveal delay={140}>
            <div className="mt-12 flex justify-center sm:hidden">
              <Button asChild variant="outline">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}