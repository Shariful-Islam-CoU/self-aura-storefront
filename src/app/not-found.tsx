import Link from "next/link";
import { SearchX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Root not-found page.
 *
 * `notFound()` is called for an unknown category slug, an inactive category,
 * and any unmatched route. Without this file Next falls back to its built-in
 * default, which renders as a blank area inside the storefront layout - the
 * site chrome appeared around an empty page with no explanation and no way
 * out. A server component (no `error`/`reset` props here) gives every 404 the
 * same real message and a route back into the catalogue.
 */
export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
        title="We couldn't find that page"
        description="The page you're looking for may have moved, or the link might be out of date. The shop is a good place to start."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/shop">Browse shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        }
      />
    </Container>
  );
}
