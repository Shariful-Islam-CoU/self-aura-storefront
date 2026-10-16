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
   * for product grids. Interactive cards need the full card width for the
   * quantity stepper and button to share a row, so the grid is a single column
   * on phones and two columns from `sm` up.
   */
  interactive?: boolean;
}

/**
 * Responsive product grid.
 *
 * - Interactive (default): 1 column on mobile, 2 from `sm`, 3 from `md` and 4
 *   on wide screens; `dense` delays the fourth column until extra-wide.
 * - Non-interactive: 2 columns on mobile, matching a browse-only tile.
 * - Demo cards never get purchase controls (their ids are not real products).
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
        "grid gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3",
        withPurchase ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
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
