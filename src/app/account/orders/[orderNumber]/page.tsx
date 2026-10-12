import type { Metadata } from "next";
import { OrderDetailClient } from "@/features/account/components/OrderDetailClient";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

/**
 * /account/orders/[orderNumber] - one order's details + tracking.
 *
 * Private page (noindex; the title stays generic so no order data leaks into
 * SEO metadata). The order number comes from the URL, exactly as the backend
 * assigned it on order creation - the storefront never generates one.
 *
 * This stays a Server Component (for metadata) and delegates data loading to
 * OrderDetailClient: the customer token lives in browser localStorage, which
 * no Server Component can read. Fetching here would always see `token: null`.
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;

  return <OrderDetailClient orderNumber={orderNumber} />;
}
