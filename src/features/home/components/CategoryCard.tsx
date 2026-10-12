import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

/**
 * Large-image category tile. Whole card is a single link (no nested
 * interactive elements); text sits on a scrim over the artwork.
 *
 * The artwork is the category's uploaded thumbnail, or a branded fallback when
 * it has none. Most categories will never get a thumbnail — that is a normal
 * state, not an error — so the fallback is designed rather than apologetic: a
 * warm gradient in the brand's own palette with a monogram, which looks
 * deliberate next to a photographed tile instead of looking like a broken
 * image. It is painted with CSS, so it costs no request and never shifts
 * layout.
 */
export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <li>
      <Link
        href={`/categories/${category.slug}`}
        aria-label={`Explore ${category.name}`}
        className="group block overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[4/5]">
          {/*
            The shared media frame is used rather than a bare `next/image` so the
            tile reserves its box, shows a skeleton while loading, and degrades
            to the branded fallback on a failed load or a missing URL — one code
            path, identical to every other image on the site.
          */}
          <ProductImageFrame
            src={category.thumbnail?.url ?? null}
            alt={category.thumbnail?.alt?.trim() || `${category.name} collection`}
            aspectRatio="4 / 5"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="h-full w-full border-0"
            rounded="rounded-none"
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            fallbackLabel={`No photo for ${category.name} yet`}
          >
            {/*
              The monogram rides above the frame, so a category WITH a photo
              still gets an initial as a quiet brand mark, and a category
              without one gets the same treatment over the gradient. Decorative:
              the link's accessible name already says which category this is, so
              announcing it twice would be noise.
            */}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="font-display text-6xl tracking-tight text-white/25">
                {monogram(category.name)}
              </span>
            </span>
          </ProductImageFrame>

          {/* Scrim for legibility over any artwork, and over the gradient too -
              it is what makes the white type readable either way. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5"
          />

          <span className="absolute inset-x-0 bottom-0 block p-5">
            <h3 className="font-display text-lg tracking-tight text-white">{category.name}</h3>
            {category.description && <p className="mt-1 text-xs leading-relaxed text-white/85">{category.description}</p>}
            <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-label uppercase tracking-[0.14em] text-white/90">
              Explore
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * One letter for the branded tile: the first character of the first word, so
 * "Fine Jewelry" reads as F and "Home Linens" as H rather than as the start of
 * a compound name.
 *
 * Diacritics are left alone deliberately. These are Latin-script category
 * names today, and stripping a mark to produce a "cleaner" initial would be a
 * guess about a language this component does not know.
 */
function monogram(name: string): string {
  const first = name.trim().split(/\s+/)[0]?.[0] ?? "";
  return first.toUpperCase();
}
