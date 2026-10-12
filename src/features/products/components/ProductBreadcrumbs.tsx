import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/types";

interface ProductBreadcrumbsProps {
  product: Product;
}

/**
 * Home / Shop / Category / Product breadcrumb.
 *
 * The category crumb only appears when the backend provides a category slug
 * (the storefront's category URL structure). The final crumb (product name)
 * is the page itself - marked with aria-current and truncated responsively.
 */
export function ProductBreadcrumbs({ product }: ProductBreadcrumbsProps) {
  const crumbs: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];

  if (product.category.slug) {
    crumbs.push({
      label: product.category.name ?? "Category",
      href: `/categories/${product.category.slug}`,
    });
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-x-1.5">
            <Link
              href={crumb.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {crumb.label}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </li>
        ))}
        <li
          aria-current="page"
          className="max-w-[45vw] truncate text-foreground sm:max-w-xs"
        >
          {product.name}
        </li>
      </ol>
    </nav>
  );
}