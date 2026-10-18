import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps extends HTMLAttributes<HTMLUListElement> {
  products: Product[];
  demo?: boolean;
  /**
   * Use when the grid sits in a narrower column (e.g. beside the catalogue
   * filter sidebar), so four cards don't get squeezed. The breakpoints shift
   * one step later rather than dropping a column, keeping the same
   * `ProductCard` everywhere.
   */
  dense?: boolean;
  /**
   * Show the in-card purchase controls (quantity + Add to bag). On by default
   * for product grids; demo cards never get them (their ids are not real
   * products).
   */
  interactive?: boolean;
}

/**
 * Responsive product grid: 2 columns on mobile, 3 on tablet, 4 on desktop.
 * With `dense`, 4 columns only on extra-wide screens.
 *
 * `auto-rows-fr` gives every row a shared height so the stacked purchase
 * controls line up at the bottom of each card.
 */
export function ProductGrid({
  products,
  demo = false,
  dense = false,
  interactive = true,
  className,
  ...props
}: ProductGridProps) {
  const withPurchase = interactive && !demo;

  return (
    <ul
      role="list"
      className={cn(
        "grid auto-rows-fr grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3",
        dense ? "xl:grid-cols-4" : "lg:grid-cols-4",
        className
      )}
      {...props}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          demo={demo}
          interactive={withPurchase}
        />
      ))}
    </ul>
  );
}
