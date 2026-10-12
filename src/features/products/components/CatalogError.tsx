import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { toCatalogErrorView } from "../lib/catalogErrors";

interface CatalogErrorProps {
  /** The failure to describe. Mapped to friendly copy - never rendered raw. */
  error: unknown;
  action?: "load" | "search";
  /** Hide the surrounding page padding when nested inside a page layout. */
  contained?: boolean;
}

/**
 * Customer-facing catalogue failure state.
 *
 * A plain server component, so both the route `error.tsx` boundary and the
 * page itself can render it. Copy is chosen from the HTTP status by
 * `toCatalogErrorView`; the backend's own message, status text and stack
 * never reach the customer.
 *
 * Retry is a plain link back to the same URL, which re-runs the server
 * component and therefore re-issues the catalogue request.
 */
export default function CatalogError({ error, action = "load", contained = false }: CatalogErrorProps) {
  const view = toCatalogErrorView(error, action);

  const state = <ErrorState title={view.title} description={view.description} />;

  const actions = (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button asChild variant="outline">
        <Link href="/shop">Try again</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );

  if (contained) {
    return (
      <div>
        {state}
        {actions}
      </div>
    );
  }

  return (
    <Container className="py-16 sm:py-24">
      {state}
      {actions}
    </Container>
  );
}
