import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { loadProductDetailsPage } from "@/services/catalogService";
import { loadCatalog } from "@/features/products/lib/catalogLoad";

import CatalogError from "@/features/products/components/CatalogError";
import { ProductBreadcrumbs } from "@/features/products/components/ProductBreadcrumbs";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { ProductInfo } from "@/features/products/components/ProductInfo";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { ProductReviews } from "@/features/reviews/components/ProductReviews";
import { siteConfig } from "@/lib/config/env";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Product details page /products/[slug] (real data).
 *
 * The product is resolved by slug against the active backend catalogue
 * (server-side, cached per request - see catalogService). The layout is a
 * premium two-column details view: interactive gallery left, information +
 * purchase controls right, related products below. Same slug scheme the Shop
 * and Category pages already use for ProductCard links.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Metadata must never throw. `generateMetadata` runs outside the page's
  // `error.tsx` boundary, so a failed catalogue read here would blank the
  // whole route. The page below still throws, and the boundary renders the
  // customer-facing error state.
  const result = await loadCatalog(() => loadProductDetailsPage(slug));
  if (!result.ok) {
    return { title: "Product" };
  }

  const { product } = result.value;

  if (!product) {
    return { title: "Product not found" };
  }

  // Use the product's actual description (flattened, truncated) - never a
  // fabricated blurb. Fallback stays factual (name + category are real).
  const description = product.description
    ? product.description.replace(/\s+/g, " ").trim().slice(0, 160)
    : `Shop ${product.name} from the ${product.category.name ?? "Self Aura"} collection.`;

  // Build JSON-LD structured data for Product schema
  const structuredData = buildProductStructuredData(product);

  return {
    title: product.name,
    description,
    alternates: { canonical: `${siteConfig.siteUrl}/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `${siteConfig.siteUrl}/products/${product.slug}`,
      siteName: siteConfig.name,
      images: (() => {
        const primary = getPrimaryImage(product.images);
        return primary ? [{ url: primary.url, alt: primary.alt }] : undefined;
      })(),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: (() => {
        const primary = getPrimaryImage(product.images);
        return primary ? [primary.url] : undefined;
      })(),
    },
    other: {
      "script:ld+json": structuredData,
    },
  };
}

function getPrimaryImage(images: { url: string; alt: string; sortOrder: number }[]) {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted[0] || null;
}

function buildProductStructuredData(product: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: { id: string; name?: string; slug?: string };
  images: { url: string; alt: string; sortOrder: number }[];
  sellingPrice: number;
  compareAtPrice?: number;
  stock: number;
  lowStock: boolean;
}): string {
  const primaryImage = getPrimaryImage(product.images);

  const offers = {
    "@type": "Offer",
    url: `${siteConfig.siteUrl}/products/${product.slug}`,
    priceCurrency: "BDT",
    price: product.sellingPrice.toFixed(2),
    availability: product.stock > 0
      ? product.lowStock
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: "Self Aura",
      url: siteConfig.siteUrl,
    },
  };

  const aggregateRating = undefined; // Only include when real review data exists

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description
      ? product.description.replace(/\s+/g, " ").trim().slice(0, 300)
      : undefined,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Self Aura",
    },
    category: product.category.name,
    images: product.images.length > 0
      ? product.images.map((img) => img.url)
      : primaryImage
        ? [primaryImage.url]
        : undefined,
    offers: offers,
    aggregateRating,
    mpn: product.sku,
  };

  return JSON.stringify(data);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Render the failure in the page rather than throwing. The route's
  // `error.tsx` boundary exists as a last resort, but a Server Component that
  // throws during the initial render leaves an empty <main> with no visible
  // fallback, which reads as a broken page. Handling it here keeps the site
  // chrome and gives the customer a real message plus a retry.
  const result = await loadCatalog(() => loadProductDetailsPage(slug));
  if (!result.ok) {
    return <CatalogError error={result.error} action="load" contained />;
  }

  const { product, related } = result.value;

  if (!product) notFound();

  // Build JSON-LD structured data for this product
  const structuredData = buildProductStructuredData(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <Container className="py-10 sm:py-14">
        <ProductBreadcrumbs product={product} />

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery
            images={product.images}
            videos={product.videos}
            name={product.name}
          />
          <ProductInfo product={product} />
        </div>

        {/* Reviews & Ratings: the last part of the product story, after the
            purchase controls and before related products. Fetches on the client
            so a slow or missing review API never delays the page itself. */}
        <ProductReviews product={product} />

        <RelatedProducts products={related} />
      </Container>
    </>
  );
}