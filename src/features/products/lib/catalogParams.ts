import { buildQueryString } from "@/lib/api/client";

/**
 * Catalog URL-state helpers.
 *
 * The Shop / Category pages keep the catalog state in the URL so refresh,
 * share and back/forward all preserve the current view:
 *
 *   /shop?search=abaya&category=65f...&sort=price-asc&page=2
 *
 * Only options the backend can actually execute are exposed. The backend
 * sort supports: createdAt, name, sellingPrice, stock (asc/desc).
 */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

export type CatalogSort = (typeof SORT_OPTIONS)[number]["value"];

export interface CatalogSortQuery {
  sortBy: "createdAt" | "name" | "sellingPrice";
  sortOrder: "asc" | "desc";
}

/** Maps a UI sort choice to the backend query. All four are supported. */
export const SORT_TO_QUERY: Record<CatalogSort, CatalogSortQuery> = {
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  "price-asc": { sortBy: "sellingPrice", sortOrder: "asc" },
  "price-desc": { sortBy: "sellingPrice", sortOrder: "desc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
};

/** Catalog state carried in the URL. */
export interface CatalogParams {
  search?: string;
  /** Backend filters products by category ObjectId (`category` query param). */
  category?: string;
  sort?: CatalogSort;
  page?: number;
}

export const DEFAULT_SORT: CatalogSort = "newest";

/** Backend category ids are Mongo ObjectIds (24 hex chars). */
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Search term cap.
 *
 * The backend accepts up to 200 characters, but a search URL is meant to be
 * shareable and readable, and a real product term is far shorter. We keep the
 * cap well inside the server limit (so the API can never reject a term we
 * built) and mirror it as `maxLength` on the search inputs, which makes the
 * limit visible to the customer instead of silently truncating on submit.
 */
export const MAX_SEARCH_LENGTH = 60;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Is this one of the sort options we actually offer?
 *
 * Module-private: the UI reads its options from `SORT_OPTIONS`, so nothing
 * outside this file needs to re-check the value.
 */
function isCatalogSort(value: string | undefined): value is CatalogSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * Parse Next.js `searchParams` into a validated CatalogParams. Invalid or
 * unsupported values are dropped rather than forwarded to the backend
 * (e.g. a malformed category id would otherwise 400 on the API).
 */
export function parseCatalogParams(searchParams: RawSearchParams): CatalogParams {
  const params: CatalogParams = {};

  const search = firstString(searchParams.search)?.trim();
  if (search) params.search = search.slice(0, MAX_SEARCH_LENGTH);

  const category = firstString(searchParams.category) ?? "";
  if (OBJECT_ID_PATTERN.test(category)) params.category = category;

  const rawSort = firstString(searchParams.sort);
  if (isCatalogSort(rawSort)) params.sort = rawSort;

  const page = parsePage(firstString(searchParams.page));
  if (page !== undefined) params.page = page;

  return params;
}

/**
 * Strict page parsing.
 *
 * `Number.parseInt` alone is too permissive here: it would turn "2.5" into 2
 * and "12abc" into 12, so a malformed URL would silently request a different
 * page than the customer asked for. Only a plain run of digits is accepted,
 * and it's bounded to a range the backend can actually serve - an absurd page
 * number is dropped rather than forwarded.
 */
function parsePage(raw: string | undefined): number | undefined {
  if (!raw || !/^\d{1,6}$/.test(raw)) return undefined;
  const page = Number.parseInt(raw, 10);
  return page >= 1 ? page : undefined;
}

/**
 * Build a catalog href from params, omitting defaults (newest sort, page 1)
 * and empty values so URLs stay clean.
 */
export function catalogHref(params: CatalogParams, basePath = "/shop"): string {
  return `${basePath}${buildQueryString({
    search: params.search,
    category: params.category,
    sort: params.sort && params.sort !== DEFAULT_SORT ? params.sort : undefined,
    page: params.page && params.page > 1 ? params.page : undefined,
  })}`;
}