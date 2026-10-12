import type { Metadata } from "next";
import { OrderSuccessView } from "@/features/checkout/components/OrderSuccessView";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

interface OrderSuccessPageProps {
  params: Promise<{ orderNumber: string }>;
}

/**
 * /order-success/[orderNumber] - post-order confirmation.
 *
 * The order number in the URL is the REAL number the backend assigned during
 * order creation (the storefront never generates one). Not an SEO landing
 * page: personal order details and noindex'd.
 */
export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderNumber } = await params;
  return <OrderSuccessView orderNumber={orderNumber} />;
}