import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/env";
import { catalogService } from "@/services/catalogService";
import { loadCatalog } from "@/features/products/lib/catalogLoad";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl;

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  // Fetch categories
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categoriesResult = await loadCatalog(() => catalogService.fetchCategories());
    if (categoriesResult.ok && categoriesResult.value) {
      categoryPages = categoriesResult.value.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Ignore errors - categories will be empty
  }

  // Fetch products. The public catalogue caps a page at 48 items (larger
  // limits are rejected with a 400), so walk every page. A safety cap keeps a
  // misbehaving pagination response from looping forever.
  const SITEMAP_PAGE_SIZE = 48;
  const MAX_PAGES = 200;
  const productPages: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const productsResult = await loadCatalog(() =>
      catalogService.fetchProducts({
        page,
        limit: SITEMAP_PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
    if (!productsResult.ok || !productsResult.value) break;
    const { items, pagination } = productsResult.value;
    for (const product of items) {
      productPages.push({
        url: `${baseUrl}/products/${product.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    if (items.length === 0 || page >= (pagination?.totalPages ?? 1)) break;
  }

  return [...staticPages, ...categoryPages, ...productPages];
}