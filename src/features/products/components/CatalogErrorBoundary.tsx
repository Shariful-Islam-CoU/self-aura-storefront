"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { toCatalogErrorView } from "../lib/catalogErrors";

interface CatalogErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  action?: "load" | "search";
}

/**
 * Route-level error boundary for the catalogue pages.
 *
 * This is the safety net for anything that escapes the page - a render error,
 * or a fetch failure thrown outside the page's own try/catch. Because
 * Next.js only serialises `message`/`digest` across the RSC boundary, the
 * status is usually unknown here and `toCatalogErrorView` falls back to
 * generic copy. That is the correct outcome: customers get a neutral
 * explanation instead of backend detail.
 *
 * The page itself renders `CatalogError` directly when it can still see the
 * status, which is what produces the specific "collection isn't available
 * yet" wording for the current 401 auth-gated catalogue.
 */
export default function CatalogErrorBoundary({
  error,
  reset,
  action = "load",
}: CatalogErrorBoundaryProps) {
  const view = toCatalogErrorView(error, action);

  return (
    <Container className="py-16 sm:py-24">
      <ErrorState
        title={view.title}
        description={view.description}
        onRetry={reset}
        retryLabel="Try again"
      />
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/shop">Back to shop</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </Container>
  );
}
