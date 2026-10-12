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

  // Fetch products
  let productPages: MetadataRoute.Sitemap = [];
  try {
    // Fetch first page of products to get an idea; in production, you'd paginate through all
    const productsResult = await loadCatalog(() =>
      catalogService.fetchProducts({
        page: 1,
        limit: 1000,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
    if (productsResult.ok && productsResult.value) {
      productPages = productsResult.value.items.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Ignore errors - products will be empty
  }

  return [...staticPages, ...categoryPages, ...productPages];
}