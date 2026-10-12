import type { Category } from "@/types";

/**
 * PLACEHOLDER homepage categories.
 *
 * These are EXAMPLES only (Abaya, Hijab, Jewelry, Accessories) — they are NOT
 * guaranteed to exist in the backend catalogue. Once the homepage is wired to
 * a service, this module is replaced by one that maps the public category
 * endpoint into the same `Category[]` shape, so the UI below it does not
 * change.
 *
 * The `thumbnail` entries point at local artwork in `public/images`, not at the
 * Cloudinary assets the real catalogue serves. They exist so the home page is
 * not four identical fallback tiles while it is still on placeholder data; a
 * category with no `thumbnail` at all renders the branded monogram tile, which
 * is the path every real category without an uploaded photo takes.
 */
export const homeCategories: Category[] = [
  {
    id: "home-cat-abaya",
    name: "Abaya",
    slug: "abaya",
    description: "Elegant outerwear for every occasion.",
    thumbnail: {
      url: "/images/category-abaya.png",
      alt: "Abaya — abstract placeholder",
    },
  },
  {
    id: "home-cat-hijab",
    name: "Hijab",
    slug: "hijab",
    description: "Soft, considered pieces for daily wear.",
    thumbnail: {
      url: "/images/category-hijab.png",
      alt: "Hijab — abstract placeholder",
    },
  },
  {
    id: "home-cat-jewelry",
    name: "Jewelry",
    slug: "jewelry",
    description: "Fine details that finish an outfit.",
    thumbnail: {
      url: "/images/category-jewelry.png",
      alt: "Jewelry — abstract placeholder",
    },
  },
  {
    id: "home-cat-accessories",
    name: "Accessories",
    slug: "accessories",
    description: "The everyday extras, curated.",
    thumbnail: {
      url: "/images/category-accessories.png",
      alt: "Accessories — abstract placeholder",
    },
  },
];