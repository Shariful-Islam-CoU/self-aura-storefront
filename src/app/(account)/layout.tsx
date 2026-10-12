import Link from "next/link";

/**
 * Minimal chrome for the account group (login / register / account). No
 * storefront header or footer - a clean, focused surface with a way back to
 * the shop.
 */
export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Self Aura - home"
          >
            <span className="font-display text-xl font-medium tracking-wide text-foreground">
              Self&nbsp;Aura
            </span>
            <span aria-hidden="true" className="mt-0.5 inline-block h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
          </Link>
          <Link
            href="/shop"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ← Back to shop
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        {children}
      </main>
    </div>
  );
}