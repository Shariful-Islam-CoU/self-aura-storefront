import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { catalogService, CATALOG_PAGE_SIZE } from "@/services/catalogService";
import { CatalogToolbar } from "@/features/products/components/CatalogToolbar";
import { CatalogFilterPanel } from "@/features/products/components/CatalogFilterPanel";
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
import { siteConfig } from "@/lib/config/env";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Category catalogue page (real data).
 *
 * The backend has no slug lookup (`GET /api/categories/:id` takes an
 * ObjectId), so the category is resolved by slug against the small category
 * list; products are then filtered on the backend with `category=<id>`.
 *
 * It reuses the same discovery architecture as `/shop` - the same toolbar,
 * URL contract (`?search=&sort=&page=`), result summary, empty state and
 * pagination - so the two pages behave identically. The one difference is
 * deliberate: this route's category is fixed by its path, so there is no
 * category filter to offer. A `category` query param is therefore *not*
 * accepted here, which keeps `/categories/dresses?category=<jewelry-id>` from
 * silently showing jewellery inside the Dresses page.
 */
export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { search } = parseCatalogParams(query);

  // Metadata must never throw. `generateMetadata` runs outside the page's
  // `error.tsx` boundary, so a failed catalogue read here would blank the
  // whole route instead of showing the page's own error state.
  const result = await loadCatalog(() => catalogService.fetchCategoryBySlug(slug));
  if (!result.ok || !result.value) {
    return { title: "Category" };
  }
  const category = result.value;

  // Build JSON-LD structured data for ItemList (category page)
  const structuredData = buildCategoryStructuredData(category);

  return {
    title: category.name,
    description:
      category.description ?? `Browse the ${category.name} collection at Self Aura.`,
    alternates: { canonical: `${siteConfig.siteUrl}/categories/${category.slug}` },
    openGraph: {
      type: "website",
      title: category.name,
      description: category.description ?? `Browse the ${category.name} collection at Self Aura.`,
      url: `${siteConfig.siteUrl}/categories/${category.slug}`,
      siteName: siteConfig.name,
      images: category.thumbnail
        ? [{ url: category.thumbnail.url, alt: category.thumbnail.alt }]
        : undefined,
    },
    other: {
      "script:ld+json": structuredData,
    },
    // Same rationale as /shop: a search term is arbitrary customer input, so
    // the resulting URL is crawlable but not indexed.
    ...(search ? { robots: { index: false, follow: true } } : {}),
  };
}

function buildCategoryStructuredData(category: {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: { url: string; alt?: string };
}): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} - ${siteConfig.name}`,
    description: category.description ?? `Browse the ${category.name} collection at Self Aura.`,
    url: `${siteConfig.siteUrl}/categories/${category.slug}`,
    image: category.thumbnail?.url,
    itemListElement: [], // Empty for category page - products are rendered client-side
    numberOfItems: 0,
  };

  return JSON.stringify(data);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const catalogParams = parseCatalogParams(await searchParams);
  const sort = catalogParams.sort ?? DEFAULT_SORT;
  const page = catalogParams.page ?? 1;
  const sortQuery = SORT_TO_QUERY[sort];

  // The route's category wins; a `category` query param is ignored on purpose.
  const search = catalogParams.search;
  const baseHref = `/categories/${slug}`;

  const categoryResult = await loadCatalog(() => catalogService.fetchCategoryBySlug(slug));

  // A failed lookup must render the page's own error state rather than throw:
  // a throw here would escape to the route boundary and lose the breadcrumb.
  if (!categoryResult.ok) {
    return (
      <Container className="py-12 sm:py-16">
        <CatalogError error={categoryResult.error} action={search ? "search" : "load"} />
      </Container>
    );
  }

  // A successful lookup that finds nothing is a genuine 404.
  const category = categoryResult.value;
  if (!category) notFound();

  // Build JSON-LD structured data for this category
  const structuredData = buildCategoryStructuredData(category);

  const productsResult = await loadCatalog(() =>
    catalogService.fetchProducts({
      search,
      category: category.id,
      sortBy: sortQuery.sortBy,
      sortOrder: sortQuery.sortOrder,
      page,
      limit: CATALOG_PAGE_SIZE,
    })
  );

  const breadcrumb = (
    <nav aria-label="Breadcrumb">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All products
      </Link>
    </nav>
  );

  const header = (
    <header className="mt-8 max-w-2xl">
      <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">Category</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      )}
    </header>
  );

  if (!productsResult.ok) {
    return (
      <Container className="py-12 sm:py-16">
        {breadcrumb}
        {header}
        <div className="mt-10">
          <CatalogError error={productsResult.error} action={search ? "search" : "load"} />
        </div>
      </Container>
    );
  }

  const catalogue = productsResult.value;

  if (catalogue.pagination.totalPages > 0 && page > catalogue.pagination.totalPages) {
    redirect(catalogHref({ ...catalogParams, page: catalogue.pagination.totalPages }, baseHref));
  }

  const hasFilters = Boolean(search);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <Container className="py-12 sm:py-16">
        {breadcrumb}
        {header}

        <div className="mt-8">
          <CatalogToolbar search={search} sort={sort} category={category.id} baseHref={baseHref} />
        </div>

        {/*
          The category is fixed by the route, so there is no category list to
          filter by and no drawer worth opening. The shared panel is still
          rendered inline so an active search shows the same removable chip and
          "Clear all" as /shop, rather than a second implementation.
        */}
        {search && (
          <div className="mt-6">
            <CatalogFilterPanel
              categories={[]}
              current={catalogParams}
              baseHref={baseHref}
              hideCategories
            />
          </div>
        )}

        {catalogue.items.length > 0 && (
          <div className="mt-6">
            <CatalogResultSummary
              search={search}
              categoryName={search ? undefined : category.name}
              total={catalogue.pagination.total}
            />
          </div>
        )}

        <div className="mt-6">
          {catalogue.items.length > 0 ? (
            <ProductGrid products={catalogue.items} />
          ) : (
            <CatalogEmptyState hasFilters={hasFilters} baseHref={baseHref} />
          )}
        </div>

        {catalogue.items.length > 0 && (
          <CatalogPagination
            pagination={catalogue.pagination}
            current={{ ...catalogParams, page }}
            baseHref={baseHref}
          />
        )}
      </Container>
    </>
  );
}
