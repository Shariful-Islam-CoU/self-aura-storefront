"use client";

import CatalogErrorBoundary from "@/features/products/components/CatalogErrorBoundary";

/**
 * Product detail page error boundary. Reuses the catalogue boundary so a
 * product failure and a catalogue failure are worded consistently; the
 * wording is generic here because Next.js only serialises `message`/`digest`
 * across the RSC boundary, so the HTTP status is usually not available.
 */
export default function ProductPageError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CatalogErrorBoundary {...props} />;
}