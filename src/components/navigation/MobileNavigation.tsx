"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavLinks } from "@/constants/navigation";
import { Button } from "@/components/ui/Button";
import { Portal } from "@/components/ui/Portal";
import { useAuth } from "@/contexts/AuthContext";

/**
 * `true` only after the client has hydrated. Used to defer the portaled drawer
 * so the server HTML and the first client render agree. A no-op external store
 * keeps this out of an effect (and off the setState-in-effect lint rule).
 */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Mobile slide-over navigation. Minimal and accessible: Escape closes the
 * panel, focus moves to the close button, and the body scroll is locked
 * while open.
 *
 * The account entry lives here (rather than in the masthead) because the
 * header hides the account icon below `sm` to keep the three action icons
 * from crowding the logo on a phone - without this, a small-screen visitor
 * would have no way to sign in or reach their account.
 */
export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const pathname = usePathname();
  const { isLoggedIn, openLoginModal } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape-to-close, focus management, and scroll lock.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/*
        The drawer is portaled to <body>. The header applies `backdrop-blur`,
        which makes it a containing block for `position: fixed` descendants;
        rendered inline, the panel would be clipped to the 64px header strip
        instead of covering the viewport.
      */}
      {mounted && (
        <Portal>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-foreground/40 transition-opacity lg:hidden",
              open ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            inert={!open}
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-border bg-background shadow-lg transition-transform lg:hidden",
              open ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <span className="font-display text-lg font-medium tracking-wide">Menu</span>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
              {mainNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-md px-4 py-3 text-base font-label transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Account - the only account entry point on screens below `sm`. */}
            <div className="shrink-0 border-t border-border p-4">
              {isLoggedIn ? (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-label text-foreground transition-colors hover:bg-muted"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                  My account
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openLoginModal(false, "/account");
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-base font-label text-foreground transition-colors hover:bg-muted"
                >
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Sign in
                </button>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
