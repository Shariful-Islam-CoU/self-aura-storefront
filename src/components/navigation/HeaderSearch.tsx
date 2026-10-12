"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { catalogHref, MAX_SEARCH_LENGTH } from "@/features/products/lib/catalogParams";

/**
 * Header search entry point, available on every page.
 *
 * A slide-down panel rather than a permanent header field: the masthead is a
 * fixed three-zone grid, and squeezing a 200px input in beside the nav and
 * three action icons would crowd it below 1280px. The panel keeps the
 * existing layout untouched and still gives a full-width, prominent field.
 *
 * It submits to `/shop?search=...` - the same `search` parameter the backend
 * itself accepts - so there is no second search route and no client-side
 * filtering. Because it's rendered on every page, its own state must be
 * derived from the URL, not remembered: navigating to a search result and
 * pressing Back should not leave a stale term in the field.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Move focus into the field when the panel opens, and Escape closes it and
  // returns focus to the trigger so keyboard users aren't stranded.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = term.trim();
    if (!next) return;
    setOpen(false);
    // A search always starts at page 1 of the results.
    router.push(catalogHref({ search: next, page: undefined }));
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="header-search-panel"
        aria-label="Search products"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-40">
          {/* Clicking away dismisses without navigating. */}
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            id="header-search-panel"
            className="relative border-b border-border bg-background shadow-lg"
          >
            <form
              role="search"
              onSubmit={handleSubmit}
              className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4 sm:px-6"
            >
              <label htmlFor="header-search-input" className="sr-only">
                Search products
              </label>
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  ref={inputRef}
                  id="header-search-input"
                  type="search"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search products"
                  autoComplete="off"
                  maxLength={MAX_SEARCH_LENGTH}
                  className="h-11 pl-9"
                />
              </div>
              <Button type="submit" className="h-11">
                Search
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="h-11 w-11"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
