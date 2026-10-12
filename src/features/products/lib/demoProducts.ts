import type { Product } from "@/types";

/**
 * PLACEHOLDER catalogue used ONLY to establish the storefront's layout and
 * design language before the backend product API is connected.
 *
 * These are NOT real Self Aura products. Every usage renders a visible
 * "Preview" badge, and nothing here is persisted or sent to the API.
 *
 * Imagery is abstract local placeholder art (see scripts/generate-placeholders.ps1),
 * never real product photography.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export const demoProducts: Product[] = Array.from({ length: 12 }, (_, index) => {
  const n = index + 1;
  return {
    id: `demo-${n}`,
    name: `Sample Piece ${pad(n)}`,
    slug: `sample-piece-${n}`,
    sku: `DEMO-${pad(n)}`,
    description: "Placeholder product used to preview the storefront layout.",
    category: { id: "demo-category", name: "Private Collection", slug: "private-collection" },
    images: [
      {
        url: `/images/product-${pad(n)}.png`,
        alt: `Self Aura sample piece ${n} — abstract placeholder`,
        sortOrder: 0,
      },
    ],
    // No clips: a placeholder clip would need a real MP4 and a poster, and
    // nothing here is worth downloading. Every product in the real catalogue
    // gets `videos: []` from the adapter, so the empty list is the shape the UI
    // is exercised against.
    videos: [],
    sellingPrice: 850 + index * 320,
    // Every third item shows a "was" price to exercise the discount badge.
    compareAtPrice: index % 3 === 0 ? 1200 + index * 320 : undefined,
    // One sold-out item + a mix of low stock so badges stay visible in layout.
    stock: n === 12 ? 0 : (n % 7) + 1,
    lowStock: n % 3 === 0,
  };
});