import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

/**
 * Customer-facing 404 for an unknown/inactive product. No internal backend
 * detail is exposed.
 */
export default function ProductNotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <PackageSearch className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Product not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This product may have been removed or is no longer available.
        </p>
        <Button asChild className="mt-8">
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
    </Container>
  );
}