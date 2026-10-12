"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { formatPrice } from "@/lib/utils/format";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { WishlistToggle } from "@/features/wishlist/components/WishlistToggle";
import { availabilityLabel, getAvailability } from "../lib/availability";
import { AddToCartButton } from "./AddToCartButton";
import { QuantitySelector } from "./QuantitySelector";
import { ShareProduct } from "./ShareProduct";
import { siteConfig } from "@/lib/config/env";
import type { Product } from "@/types";

interface ProductInfoProps {
  product: Product;
}

/**
 * Product information panel (right column on desktop, below the gallery on
 * mobile). Interactive only where it must be (quantity + add-to-bag) - the
 * data itself is server-provided.
 *
 * Customer-safe fields only: name, price, availability, description,
 * category, SKU. Internal data (costPrice, supplier, notes) is never part of
 * the storefront Product view model and therefore never rendered.
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { status, addToCart } = useAddToCart(product, quantity);

  const availability = getAvailability(product);
  const unavailable = availability === "out-of-stock";

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100)
    : 0;

  const categoryName = product.category.name;
  const categorySlug = product.category.slug;

  return (
    <section aria-label="Product information" className="lg:sticky lg:top-24 lg:self-start">
      {/* Category - clickable when the backend provides a slug */}
      {categorySlug ? (
        <Link
          href={`/categories/${categorySlug}`}
          className="inline-block rounded-sm text-xs font-label uppercase tracking-[0.18em] text-accent transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {categoryName ?? "Browse collection"}
        </Link>
      ) : categoryName ? (
        <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">{categoryName}</p>
      ) : null}

      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {product.name}
      </h1>

      {/* Price - never invented; shows compare-at when the backend provides it */}
      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <p className="font-display text-2xl font-medium text-foreground">
          {formatPrice(product.sellingPrice)}
        </p>
        {product.compareAtPrice && (
          <>
            <p className="text-base text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
            {discount > 0 && <Badge variant="destructive">{discount}% off</Badge>}
          </>
        )}
      </div>

      {/* Availability from the real backend stock */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge
          variant={
            availability === "in-stock"
              ? "success"
              : availability === "low-stock"
                ? "warning"
                : "destructive"
          }
        >
          {availabilityLabel(availability)}
        </Badge>
        {availability === "low-stock" && (
          <p className="text-sm text-warning">Only {product.stock} left in stock</p>
        )}
        {unavailable && (
          <p className="text-sm text-muted-foreground">This item is currently unavailable.</p>
        )}
      </div>

      {/* Description - readable line length, basic formatting preserved */}
      {product.description && (
        <div className="mt-8">
          <h2 className="text-sm font-label text-foreground">Description</h2>
          <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>
      )}

      {/* Meta - SKU only (customer-safe) */}
      <Separator className="mt-8" />
      <dl className="mt-6 flex gap-2 text-sm">
        <dt className="w-14 shrink-0 text-muted-foreground">SKU</dt>
        <dd className="text-foreground">{product.sku}</dd>
      </dl>

      {/* Purchase row */}
      <Separator className="mt-8" />
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={product.stock > 0 ? product.stock : undefined}
          disabled={unavailable}
        />
        <AddToCartButton
          disabled={unavailable}
          status={status}
          onClick={() => void addToCart()}
        />
      </div>

      {/* Wishlist - secondary action beneath the purchase row (never blocks
          quantity selection or Add to bag) */}
      <div className="mt-4 flex items-center gap-3">
        <WishlistToggle variant="button" productId={product.id} productName={product.name} />
        <ShareProduct
          url={`${siteConfig.siteUrl}/products/${product.slug}`}
          title={product.name}
          description={product.description}
          image={product.images[0]?.url}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          This item is currently unavailable.
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {status === "added" ? "Added to bag" : ""}
      </p>
    </section>
  );
}