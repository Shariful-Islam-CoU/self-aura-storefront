"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavLinks } from "@/constants/navigation";

/** Desktop primary navigation with an accent underline on the active link. */
export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center justify-center">
      <ul className="flex items-center gap-8" role="list">
        {mainNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative text-sm font-label transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "text-foreground after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-px after:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}