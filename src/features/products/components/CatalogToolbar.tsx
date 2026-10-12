"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  catalogHref,
  MAX_SEARCH_LENGTH,
  SORT_OPTIONS,
  type CatalogParams,
  type CatalogSort,
} from "../lib/catalogParams";

interface CatalogToolbarProps {
  search?: string;
  sort: CatalogSort;
  /** Existing category ObjectId to preserve when search/sort changes. */
  category?: string;
  baseHref?: string;
  /**
   * The filter controls, shown in a slide-over drawer below `lg` and in the
   * desktop sidebar at `lg+`. Passed in by the page (a server component), so
   * the markup inside stays server-rendered and the drawer only adds
   * open/close state.
   */
  filters?: React.ReactNode;
  /** Number of active filters, shown as a badge on the Filters button. */
  activeFilterCount?: number;
}

/**
 * Search + sort controls for the catalogue.
 *
 * All three controls write to the URL and the server page re-renders - there
 * is no client-side data fetching and no second product-fetching path.
 *
 * Search deliberately does **not** fire on every keystroke. The input holds a
 * local `draft`; a request only happens when the customer submits (Enter or
 * the Search button). That keeps a 4-character search from firing four
 * requests, and it keeps the input state separable from the committed query:
 *
 *   type "abaya"  -> no request, draft only
 *   press Enter   -> /shop?search=abaya, then the backend request happens
 *
 * A change to search, sort or category always resets `page` to 1, so someone
 * who filters down from page 4 never lands on an empty page 4.
 *
 * `router.push` is used (not `replace`) so Back/Forward walk the search
 * history. Commits are de-duplicated against the current URL first, so
 * submitting an unchanged term is a no-op rather than a duplicate history
 * entry.
 */
export function CatalogToolbar({
  search = "",
  sort,
  category,
  baseHref = "/shop",
  filters,
  activeFilterCount = 0,
}: CatalogToolbarProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(search);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const syncedSearch = useRef(search);

  // Re-sync the input when the URL changes from *outside* this component
  // (a chip's "x", browser Back/Forward, a shared link). The ref guard skips
  // the first run so typing is never interrupted.
  useEffect(() => {
    if (syncedSearch.current === search) return;
    syncedSearch.current = search;
    setDraft(search);
  }, [search]);

  function commit(next: CatalogParams) {
    const href = catalogHref(next, baseHref);
    if (
      typeof window !== "undefined" &&
      href === `${window.location.pathname}${window.location.search}`
    ) {
      // Already showing this exact view - don't add a duplicate history entry.
      setDraft(next.search ?? "");
      syncedSearch.current = next.search ?? "";
      setDrawerOpen(false);
      return;
    }
    syncedSearch.current = next.search ?? "";
    setDrawerOpen(false);
    router.push(href);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = draft.trim();
    setDraft(term);
    commit({ search: term || undefined, sort, category, page: 1 });
  }

  function handleClear() {
    setDraft("");
    commit({ search: undefined, sort, category, page: 1 });
  }

  function handleSortChange(value: string) {
    commit({ search: search.trim() || undefined, sort: value as CatalogSort, category, page: 1 });
  }

  const hasDraft = draft.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* A real <form> gives Enter-to-submit, the mobile "Go" key and native
            form semantics without any key handler. */}
        <form onSubmit={handleSubmit} role="search" className="w-full sm:max-w-xs">
          <label htmlFor="catalog-search" className="mb-1.5 block text-sm font-label text-foreground">
            Search products
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="catalog-search"
              type="search"
              placeholder="Search products"
              autoComplete="off"
              maxLength={MAX_SEARCH_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-10 pl-9 pr-9"
            />
            {hasDraft && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {/* Announces the committed query without moving focus. `aria-live`
              alone would re-announce the input's value on every keystroke. */}
          <p aria-live="polite" className="sr-only">
            {search ? `Showing results for ${search}` : ""}
          </p>
        </form>

        <div className="flex items-end gap-3 sm:ml-auto">
          <div className="w-44 sm:w-52">
            <label htmlFor="catalog-sort" className="mb-1.5 block text-sm font-label text-foreground">
              Sort
            </label>
            <Select
              id="catalog-sort"
              value={sort}
              onChange={(event) => handleSortChange(event.target.value)}
              options={[...SORT_OPTIONS]}
              className="h-10"
            />
          </div>

          {filters && (
            <Button onClick={() => setDrawerOpen(true)} className="h-10 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-background"
                  aria-label={`${activeFilterCount} active filters`}
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {filters && (
        <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {filters}
        </FilterDrawer>
      )}
    </div>
  );
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Mobile filter slide-over. Mirrors the existing `MobileNavigation` drawer:
 * Escape closes, focus moves to the close button, and body scroll is locked
 * while open.
 *
 * It wraps server-rendered children rather than owning the controls, so the
 * same markup is shared with the desktop sidebar and can't drift.
 */
function FilterDrawer({ open, onClose, children }: FilterDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-sm flex-col border-l border-border bg-background shadow-xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="font-display text-lg text-foreground">Filters</h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        {/* Any filter link navigates, which unmounts this drawer; closing on
            click avoids leaving a stale overlay behind if it doesn't. */}
        <div className="flex-1 overflow-y-auto px-4 py-6" onClick={onClose}>
          {children}
        </div>
      </div>
    </div>
  );
}
