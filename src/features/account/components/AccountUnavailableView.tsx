import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AccountUnavailableViewProps {
  /** Small overline label, e.g. "Customer area" or "My orders". */
  eyebrow: string;
  /** Page title rendered as the H1 (e.g. "My account", "My orders"). */
  title: string;
  /** Customer-safe explanation of why this page cannot show data yet. */
  description: string;
}

/**
 * Honest placeholder for the customer account pages.
 *
 * Customer authentication does not exist in the backend yet (every order,
 * shipment and customer endpoint is management-auth + permission gated), so
 * the storefront has no way to load a customer's account, orders or tracking.
 * Rather than fabricating data - or redirecting visitors in circles - each
 * account page renders this panel with clear, customer-friendly next steps.
 * When the backend gains customer authentication plus customer-safe read
 * APIs, this component is replaced by the real account views behind the same
 * routes.
 */
export function AccountUnavailableView({
  eyebrow,
  title,
  description,
}: AccountUnavailableViewProps) {
  return (
    <div className="w-full">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
        {title}
      </h1>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Info className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/shop">Start shopping</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}