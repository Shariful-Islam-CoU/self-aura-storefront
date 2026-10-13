import Link from "next/link";
import { Container } from "./Container";
import { BrandMark } from "./BrandMark";
import { MainNavigation } from "@/components/navigation/MainNavigation";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { HeaderSearch } from "@/components/navigation/HeaderSearch";
import { CartButton } from "@/components/navigation/CartButton";
import { WishlistButton } from "@/components/navigation/WishlistButton";
import { AccountButton } from "@/components/navigation/AccountButton";

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`}
      aria-label="Self Aura - home"
    >
      <BrandMark />
      <span className="font-display text-xl font-medium tracking-wide text-foreground">
        Self&nbsp;Aura
      </span>
      <span aria-hidden="true" className="mt-0.5 inline-block h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
    </Link>
  );
}

/**
 * Storefront masthead. Three zones:
 *   Mobile : [menu]  [logo]       [search, wishlist, cart]   (account hidden < sm)
 *   Desktop: [logo]  [nav center] [search, account, wishlist, cart]
 * Server component - interactivity lives in the client navigation children.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left zone */}
        <div className="flex items-center justify-start">
          <div className="-ml-2 lg:hidden">
            <MobileNavigation />
          </div>
          <Wordmark className="hidden lg:flex" />
        </div>

        {/* Center zone */}
        <div className="flex items-center justify-center">
          <Wordmark className="lg:hidden" />
          <div className="hidden lg:block">
            <MainNavigation />
          </div>
        </div>

        {/* Right zone */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <HeaderSearch />
          <div className="hidden sm:block">
            <AccountButton />
          </div>
          <WishlistButton />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}