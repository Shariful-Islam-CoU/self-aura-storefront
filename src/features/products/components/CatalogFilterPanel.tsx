import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogHref, type CatalogParams } from "../lib/catalogParams";
import type { Category } from "@/types";

interface CatalogFilterPanelProps {
  categories: Category[];
  /** Current catalog state, as parsed from the URL. */
  current: CatalogParams;
  baseHref?: string;
  /**
   * Hide the category list — used on a category page, where the category is
   * already fixed by the route and listing it again would offer a filter the
   * page cannot apply.
   */
  hideCategories?: boolean;
  className?: string;
}

/**
 * The catalogue filter controls, shared by the desktop sidebar and the mobile
 * drawer so the two can never drift apart.
 *
 * Deliberately a **server component built from plain links**: every control is
 * a real URL, so browser Back/Forward, refresh, copy-link and the crawler all
 * work with no client state and no history fighting. The mobile drawer only
 * adds open/close state around this markup.
 *
 * Only backend-supported filters appear here. The public catalogue list API
 * supports `search`, `category`, `sortBy`, `sortOrder`, `page` and `limit` —
 * there is **no price filter and no availability filter**, so neither is
 * offered (see README §5 "Product discovery"). Visibility and the low-stock
 * reorder filter are management-only parameters and are not accepted here, so
 * they can never be sent by accident.
 */
export function CatalogFilterPanel({
  categories,
  current,
  baseHref = "/shop",
  hideCategories = false,
  className,
}: CatalogFilterPanelProps) {
  const hasCategory = Boolean(current.category);
  const hasSearch = Boolean(current.search);

  return (
    <div className={cn("space-y-8", className)}>
      {!hideCategories && (
        <section aria-labelledby="filter-category-heading">
          <h2
            id="filter-category-heading"
            className="text-xs font-label uppercase tracking-[0.18em] text-muted-foreground"
          >
            Category
          </h2>

          {/*
            Deliberately a list of links rather than a `role="radiogroup"`.
            A radio group advertises arrow-key roving focus, which a set of
            anchors does not implement; claiming the role would promise
            keyboard behaviour that is not there. `aria-current="page"` plus
            the visual dot carries the selection state honestly, and every
            option stays a real, shareable, pre-fetchable URL.
          */}
          <nav aria-labelledby="filter-category-heading">
            <ul className="mt-4 space-y-0.5">
              <li>
                <CategoryOption
                  href={catalogHref({ ...current, category: undefined, page: undefined }, baseHref)}
                  label="All products"
                  selected={!hasCategory}
                />
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <CategoryOption
                    href={catalogHref(
                      { ...current, category: category.id, page: undefined },
                      baseHref
                    )}
                    label={category.name}
                    selected={hasCategory && current.category === category.id}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </section>
      )}

      {(hasCategory || hasSearch) && (
        <section aria-labelledby="filter-active-heading" className="border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="filter-active-heading"
              className="text-xs font-label uppercase tracking-[0.18em] text-muted-foreground"
            >
              Active filters
            </h2>
            <Link
              href={catalogHref({}, baseHref)}
              className="rounded text-xs font-medium text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Clear all
            </Link>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {hasSearch && current.search && (
              <li>
                <FilterChip
                  href={catalogHref({ ...current, search: undefined, page: undefined }, baseHref)}
                  label={`“${current.search}”`}
                  removeLabel={`Clear search “${current.search}”`}
                />
              </li>
            )}
            {hasCategory && current.category && (
              <li>
                <FilterChip
                  href={catalogHref({ ...current, category: undefined, page: undefined }, baseHref)}
                  label={
                    categories.find((category) => category.id === current.category)?.name ??
                    "Category"
                  }
                  removeLabel="Clear category filter"
                />
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

interface CategoryOptionProps {
  href: string;
  label: string;
  selected: boolean;
}

function CategoryOption({ href, label, selected }: CategoryOptionProps) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "bg-accent/10 font-medium text-accent"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      {/* The dot is decorative: `aria-current` carries the state, so the
          choice is never signalled by colour alone. */}
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-accent bg-accent" : "border-border"
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
      </span>
      {label}
    </Link>
  );
}

interface FilterChipProps {
  href: string;
  label: string;
  /** Spoken description of what removing this chip does. */
  removeLabel: string;
}

/** One removable filter. The whole chip is a link to the URL without it. */
function FilterChip({ href, label, removeLabel }: FilterChipProps) {
  return (
    <Link
      href={href}
      title={removeLabel}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{removeLabel}</span>
    </Link>
  );
}
