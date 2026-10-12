import type { Metadata } from "next";
import {
  CategoryBannerCarousel,
  HomeFeaturedCategories,
  NewArrivals,
  HomeBrandBanner,
  BestSellers,
  WhySelfAura,
  TrustHighlights,
  NewsletterCta,
} from "@/features/home/components";
import { catalogService } from "@/services/catalogService";

export const metadata: Metadata = {
  title: "Self Aura | Discover Your Style",
  description:
    "Discover Your Aura — an elegant, hand-curated edit of fashion, jewelry and accessories for your everyday expression. Explore the Self Aura collection.",
};

export default async function HomePage() {
  const [categories, newArrivals, bestSellers] = await Promise.all([
    catalogService.fetchCategories().catch(() => []),
    catalogService.fetchProducts({ sortBy: "createdAt", sortOrder: "desc", page: 1, limit: 8 }).then(r => r.items).catch(() => []),
    catalogService.fetchProducts({ sortBy: "sellingPrice", sortOrder: "desc", page: 1, limit: 8 }).then(r => r.items).catch(() => []),
  ]);
  return (
    <>
      <CategoryBannerCarousel categories={categories} />
      <HomeFeaturedCategories categories={categories} />
      <NewArrivals products={newArrivals} />
      <HomeBrandBanner />
      <BestSellers products={bestSellers} />
      <WhySelfAura />
      <TrustHighlights />
      <NewsletterCta />
    </>
  );
}