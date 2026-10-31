"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { LoginModal } from "@/components/ui/LoginModal";

/**
 * Shared storefront chrome (header + footer) wrapping the (store) routes.
 */
function StorefrontShellInner({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, showLoginModal, closeLoginModal, openLoginModal, setLoggedIn, loginRedirectUrl } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("customer_token");
    setLoggedIn(!!token);
  }, [setLoggedIn]);

  // Listen for storage changes (e.g., login in another tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "customer_token") {
        const loggedIn = !!e.newValue;
        setLoggedIn(loggedIn);
        if (loggedIn) {
          closeLoginModal();
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [setLoggedIn, closeLoginModal]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <LoginModal
        isOpen={showLoginModal && !isLoggedIn}
        onClose={closeLoginModal}
        required={false}
        redirectUrl={loginRedirectUrl ?? undefined}
        onSuccess={() => setLoggedIn(true)}
      />
    </div>
  );
}

import { useState, useEffect } from "react";

/**
 * Storefront chrome + the providers that depend on the signed-in identity.
 *
 * `CartProvider` sits INSIDE `AuthProvider` on purpose: the cart is
 * namespaced per customer, and it must re-hydrate the moment the session
 * changes - including an in-place login from the checkout modal, which never
 * navigates or reloads.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontShellInner>{children}</StorefrontShellInner>
      </CartProvider>
    </AuthProvider>
  );
}