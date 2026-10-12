import type { Metadata } from "next";
import { CartPageView } from "@/features/cart/components/CartPageView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your Self Aura cart before checkout.",
};

/**
 * /cart - customer shopping cart.
 *
 * The page shell is a server component (metadata + layout); the cart itself
 * is client state (Context + localStorage), rendered by CartPageView.
 */
export default function CartPage() {
  return <CartPageView />;
}