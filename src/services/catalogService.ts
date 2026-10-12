import { api, ApiError, buildQueryString } from "@/lib/api/client";
import { cache } from "react";
import { mapCategoryResponse, mapProductResponse } from "@/features/products/lib/catalogMappers";
import type {
  ApiResponse,
  Category,
  CategoryResponse,
  PaginationMeta,
  Product,
  ProductListResponse,
  ProductResponse,
} from "@/types";

/**
 * Catalog data service - the single seam between UI components and the
 * backend catalogue API.
 *
 * Backend contract used (self_aura_backend). These are the PUBLIC,
 * unauthenticated read endpoints the backend mounts outside `authenticate`:
 *   GET /catalogue/products?page&limit&search&category&sortBy&sortOrder
 *     -> { data: { items: ProductResponse[], pagination } }
 *   GET /catalogue/products/slug/:slug -> { data: ProductResponse }
 *   GET /catalogue/products/id/:id     -> { data: ProductResponse }
 *   GET /catalogue/categories          -> { data: CategoryResponse[] }
 *   GET /catalogue/categories/slug/:slug -> { data: CategoryResponse }
 *
 * Publication is the backend's job: these endpoints return published
 * (`isActive`) products and categories only, so the service never has to send
 * an `isActive` filter or second-guess visibility. Responses are already
 * customer-safe - no cost price, reorder thresholds or admin metadata.
 *
 * The protected management endpoints (`/api/products`, `/api/categories`) are
 * untouched and still require a staff token; the dashboard keeps its richer
 * payload and its own filters. The shared REST client sends no Authorization
 * header, so public catalogue reads and authenticated customer calls coexist
 * without a second client.
 */

export const CATALOG_PAGE_SIZE = 12;

export type CatalogSortBy = "createdAt" | "name" | "sellingPrice" | "stock";
export type CatalogSortOrder = "asc" | "desc";

export interface CatalogQuery {
  search?: string;
  /** Category ObjectId (backend filters by id only). */
  category?: string;
  sortBy: CatalogSortBy;
  sortOrder: CatalogSortOrder;
  page: number;
  limit?: number;
}

export interface ProductList {
  items: Product[];
  pagination: PaginationMeta;
}

function dataOrThrow<T>(payload: ApiResponse<T> | null | undefined, label: string): T {
  if (!payload || !payload.data) {
    throw new ApiError(502, `Malformed response from catalogue (${label})`, payload ?? null);
  }
  return payload.data;
}

export const catalogService = {
  /**
   * Paged, searchable, sortable products. Publication filtering is applied
   * server-side, so this only sends what the customer actually chose.
   */
  async fetchProducts(query: CatalogQuery): Promise<ProductList> {
    const response = await api.get<ApiResponse<ProductListResponse>>(
      `/catalogue/products${buildQueryString({
        page: query.page,
        limit: query.limit ?? CATALOG_PAGE_SIZE,
        search: query.search,
        category: query.category,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })}`
    );
    const data = dataOrThrow(response, "products");
    return {
      items: data.items.map(mapProductResponse),
      pagination: data.pagination,
    };
  },

  /** Published categories (the public endpoint returns nothing else). */
  async fetchCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<CategoryResponse[]>>("/catalogue/categories");
    const data = dataOrThrow(response, "categories");
    return data.map(mapCategoryResponse);
  },

  /**
   * Single published category by slug - a direct lookup, used by
   * `/categories/[slug]`. Returns null when the category is unknown or not
   * published, so the route can call `notFound()`.
   */
  async fetchCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await api.get<ApiResponse<CategoryResponse>>(
        `/catalogue/categories/slug/${encodeURIComponent(slug)}`
      );
      return mapCategoryResponse(dataOrThrow(response, "category"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Single published product by slug, for `/products/[slug]`.
   *
   * A direct indexed lookup - the storefront no longer pages through the whole
   * catalogue to find one product.
   */
  async fetchProductBySlug(slug: string): Promise<Product | null> {
    try {
      const response = await api.get<ApiResponse<ProductResponse>>(
        `/catalogue/products/slug/${encodeURIComponent(slug)}`
      );
      return mapProductResponse(dataOrThrow(response, "product"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Single product by ObjectId, for the browser-local wishlist (which stores
   * ids). Throws `ApiError` on 404 so the wishlist can render a graceful
   * "no longer available" row per item.
   */
  async fetchProductById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<ProductResponse>>(
      `/catalogue/products/id/${encodeURIComponent(id)}`
    );
    return mapProductResponse(dataOrThrow(response, "product"));
  },

  /**
   * Related products: newest products from the same category, excluding the
   * current product. Uses the backend's existing category filter - no
   * client-side reduction of large datasets. Returns [] when the product has
   * no category or the category is empty.
   */
  async fetchRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    const categoryId = product.category.id;
    if (!categoryId) return [];
    const list = await this.fetchProducts({
      category: categoryId,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit,
    });
    return list.items.filter((item) => item.id !== product.id);
  },
};

export interface ProductDetailsData {
  product: Product | null;
  related: Product[];
}

/**
 * Composed lookup for /products/[slug], memoized with React `cache` so
 * `generateMetadata` and the page share a single product/related fetch per
 * request instead of duplicating requests.
 */
export const loadProductDetailsPage = cache(
  async (slug: string): Promise<ProductDetailsData> => {
    const product = await catalogService.fetchProductBySlug(slug);
    if (!product) return { product: null, related: [] };
    const related = await catalogService.fetchRelatedProducts(product);
    return { product, related };
  }
);
