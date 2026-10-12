import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/shop",
        "/shop/*",
        "/categories",
        "/categories/*",
        "/products/*",
        "/categories",
        "/products",
      ],
      disallow: [
        "/account",
        "/account/*",
        "/login",
        "/register",
        "/checkout",
        "/checkout/*",
        "/order-success/*",
        "/cart",
        "/wishlist",
        "/cart/*",
        "/wishlist/*",
        "/account",
        "/account/*",
      ],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}