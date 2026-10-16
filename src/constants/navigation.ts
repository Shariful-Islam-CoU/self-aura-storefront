/**
 * Storefront navigation configuration.
 *
 * Placeholder notes:
 * - "Categories" and "New Arrivals" point at homepage sections until the
 *   backend category/product APIs (and their dedicated pages) exist.
 * - "About" points at the brand banner on the homepage.
 * - Social + legal links are placeholders until real URLs/pages are known.
 */

export interface NavLink {
  label: string;
  href: string;
}

/** Primary navigation shown in the header (desktop) and drawer (mobile). */
export const mainNavLinks: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/#categories" },
  { label: "New Arrivals", href: "/#new-arrivals" },
  { label: "About", href: "/#story" },
];

/** Footer helper links. */
export const footerShopLinks: NavLink[] = [
  { label: "All Products", href: "/shop" },
  { label: "New Arrivals", href: "/#new-arrivals" },
  { label: "Categories", href: "/#categories" },
];

export const footerCareLinks: NavLink[] = [
  { label: "Contact", href: "/" },
  { label: "Shipping", href: "/" },
  { label: "Returns", href: "/" },
  { label: "Order Tracking", href: "/account/orders" },
];

export const footerAboutLinks: NavLink[] = [
  { label: "About Self Aura", href: "/" },
  { label: "Our Story", href: "/#story" },
];

/**
 * Social channels are admin-managed (application settings keys
 * `social.facebook`, `social.instagram`, `social.messenger`, read from
 * `GET /api/public/store-socials`) and rendered by the `SocialConnect`
 * components - never hardcoded here.
 */

/** Legal links are placeholders until real policy pages are published. */
export const footerLegalLinks: NavLink[] = [
  { label: "Privacy Policy", href: "/" },
  { label: "Terms & Conditions", href: "/" },
];