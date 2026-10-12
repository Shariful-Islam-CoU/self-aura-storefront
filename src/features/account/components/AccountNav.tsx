"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, Package, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const ACCOUNT_NAV_ITEMS = [
  { label: "Overview", href: "/account", icon: LayoutDashboard },
  { label: "Edit Profile", href: "/account/edit", icon: LayoutDashboard },
  { label: "My Orders", href: "/account/orders", icon: Package },
] as const;

/**
 * Account area navigation. Shown on /account, /account/orders and
 * /account/orders/[orderNumber]: a stacked list above the content on mobile
 * and a sticky sidebar on desktop. A guest "Sign in" entry points at the
 * existing sign-in page; a full account menu with sign-out arrives together
 * with real customer authentication.
 */
export function AccountNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  return (
    <nav aria-label="Account" className="flex flex-col gap-1 lg:sticky lg:top-24">
      {ACCOUNT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}

      {!isLoggedIn && (
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-3 rounded-md border-t border-border px-4 pt-4 text-sm font-label text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign in
        </Link>
      )}
    </nav>
  );
}