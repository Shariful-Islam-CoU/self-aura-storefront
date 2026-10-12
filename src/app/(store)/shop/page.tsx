import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { catalogService, CATALOG_PAGE_SIZE } from "@/services/catalogService";
import { CatalogFilterPanel } from "@/features/products/components/CatalogFilterPanel";
import { CatalogToolbar } from "@/features/products/components/CatalogToolbar";
import { CatalogPagination } from "@/features/products/components/CatalogPagination";
import {
  CatalogEmptyState,
  CatalogResultSummary,
} from "@/features/products/components/CatalogResultSummary";
import CatalogError from "@/features/products/components/CatalogError";
import { loadCatalog } from "@/features/products/lib/catalogLoad";
import {
  catalogHref,
  DEFAULT_SORT,
  parseCatalogParams,
  SORT_TO_QUERY,
} from "@/features/products/lib/catalogParams";

const SHOP_DESCRIPTION =
  "Browse the full Self Aura collection — curated fashion, jewelry and accessories for everyday expression.";

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * SEO.
 *
 * `/shop` itself stays indexable, and the category variants are still real
 * browseable listings. Search-result URLs are the one exception: they are
 * generated from arbitrary customer input, so indexing them would let a
 * crawler walk an unbounded set of near-duplicate pages built from junk terms.
 * Those variants are `noindex, follow` - they keep their links crawlable but
 * don't compete with `/shop` in search results. `sort` and `page` are left
 * indexable because they are a small, finite set per search.
 */
export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const { search } = parseCatalogParams(await searchParams);

  return {
    title: "Shop",
    description: SHOP_DESCRIPTION,
    ...(search ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * The Shop page - the storefront's main discovery surface.
 *
 * Server-rendered from the backend catalogue API. The entire view state lives
 * in the URL (`?search=&category=&sort=&page=`), so refresh, sharing a link
 * and Back/Forward all reproduce the same results, and the server stays the
 * single source of truth: filters never filter an already-fetched array.
 *
 * Data flow: page -> catalogService -> REST client -> backend.
 *
 * Every request the backend can actually serve is used: `search` (name, SKU
 * and description), `category` (ObjectId), `sortBy`/`sortOrder` and
 * `page`/`limit`. Publication is the backend's job - the public catalogue
 * endpoint only ever returns published products, so the page never sends a
 * visibility filter. There is deliberately **no price filter and no
 * availability filter** - the backend has no such query parameters, and
 * faking them by filtering the catalogue in the browser would contradict the
 * paged server-side fetch. See README §5.
 */
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = parseCatalogParams(await searchParams);
  const sort = params.sort ?? DEFAULT_SORT;
  const page = params.page ?? 1;
  const sortQuery = SORT_TO_QUERY[sort];

  const [categoriesResult, productsResult] = await Promise.all([
    loadCatalog(() => catalogService.fetchCategories()),
    loadCatalog(() =>
      catalogService.fetchProducts({
        search: params.search,
        category: params.category,
        sortBy: sortQuery.sortBy,
        sortOrder: sortQuery.sortOrder,
        page,
        limit: CATALOG_PAGE_SIZE,
      })
    ),
  ]);

  const header = (
    <header className="max-w-2xl">
      <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">The full edit</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Shop
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Explore the complete Self Aura collection — curated pieces, refreshed as new
        arrivals land.
      </p>
    </header>
  );

  // An unavailable catalogue is still a valid page, so the header and a way out
  // are kept - the customer is never dropped on a dead end. Each failure is
  // checked separately so the reported error is the one that actually failed.
  const renderCatalogueError = (error: unknown) => (
    <Container className="py-12 sm:py-16">
      {header}
      <div className="mt-10">
        <CatalogError error={error} action={params.search ? "search" : "load"} />
      </div>
    </Container>
  );

  // The products request is the one the customer was waiting on, so it is
  // reported in preference to a category-list failure.
  if (!productsResult.ok) return renderCatalogueError(productsResult.error);
  if (!categoriesResult.ok) return renderCatalogueError(categoriesResult.error);

  const categories = categoriesResult.value;
  const catalogue = productsResult.value;

  // Keep out-of-range pages canonical (page > totalPages returns empty).
  if (catalogue.pagination.totalPages > 0 && page > catalogue.pagination.totalPages) {
    redirect(catalogHref({ ...params, page: catalogue.pagination.totalPages }));
  }

  const hasFilters = Boolean(params.search || params.category);
  const activeFilterCount = (params.search ? 1 : 0) + (params.category ? 1 : 0);
  const activeCategoryName = params.category
    ? categories.find((category) => category.id === params.category)?.name
    : undefined;

  return (
    <Container className="py-12 sm:py-16">
      {header}

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        {/* Desktop sidebar. The identical panel is passed to the toolbar
            below, where it opens as a drawer under `lg`, so the two
            placements can never diverge. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CatalogFilterPanel categories={categories} current={params} />
          </div>
        </aside>

        <div className="min-w-0">
          <CatalogToolbar
            search={params.search}
            sort={sort}
            category={params.category}
            activeFilterCount={activeFilterCount}
            filters={<CatalogFilterPanel categories={categories} current={params} />}
          />

          <div className="mt-6">
            {catalogue.items.length > 0 ? (
              <CatalogResultSummary
                search={params.search}
                categoryName={activeCategoryName}
                total={catalogue.pagination.total}
              />
            ) : null}
          </div>

          <div className="mt-6">
            {catalogue.items.length > 0 ? (
              <ProductGrid products={catalogue.items} dense />
            ) : (
              <CatalogEmptyState hasFilters={hasFilters} />
            )}
          </div>

          {catalogue.items.length > 0 && (
            <CatalogPagination pagination={catalogue.pagination} current={{ ...params, page }} />
          )}
        </div>
      </div>
    </Container>
  );
}
