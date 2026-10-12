import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { Container } from "@/components/layout/Container";
import { AccountNav } from "@/features/account/components/AccountNav";

/**
 * Customer account chrome for the account routes:
 *
 *   /account
 *   /account/orders
 *   /account/orders/[orderNumber]
 *
 * Uses the full storefront header/footer (a consistent shopping experience)
 * plus the account navigation. These pages are private by design - noindex is
 * set per page - and currently render the honest "customer accounts aren't
 * available yet" state because the backend has no customer authentication.
 * When customer auth + customer-safe read APIs land, this layout stays
 * unchanged and the page bodies switch to the real account views.
 */
export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StorefrontShell>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </StorefrontShell>
  );
}