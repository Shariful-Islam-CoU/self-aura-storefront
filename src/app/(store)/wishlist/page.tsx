import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { WishlistView } from "@/features/wishlist/components/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved Self Aura pieces, ready whenever you are.",
  // The wishlist is customer-specific; never index it.
  robots: { index: false, follow: false },
};

/**
 * /wishlist - saved products.
 *
 * The page shell is a server component (title + description + chrome); the
 * wishlist itself is client state (ids in localStorage + live catalogue
 * data), rendered by WishlistView. Lives under the (store) group so it keeps
 * the full storefront header/footer chrome like /cart and /checkout.
 */
export default function WishlistPage() {
  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Wishlist
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Your saved pieces, kept here for later. Prices and availability always reflect the current
        collection.
      </p>
      <div className="mt-10">
        <WishlistView />
      </div>
    </Container>
  );
}