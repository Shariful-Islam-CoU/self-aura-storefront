import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

/**
 * Polished empty-cart state with a single clear path back to the shop.
 * Client-safe (imported by the client cart page view).
 */
export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />}
      title="Your cart is empty"
      description="Discover something you love from Self Aura."
      action={
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      }
    />
  );
}