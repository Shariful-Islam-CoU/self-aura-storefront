"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutPageView } from "@/features/checkout/components/CheckoutPageView";
import { LoginModal } from "@/components/ui/LoginModal";
import { customerAuthService } from "@/services/customerAuthService";
import { useAuth } from "@/contexts/AuthContext";

function CheckoutPageClient() {
  const router = useRouter();
  const { setLoggedIn, closeLoginModal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Verify the stored session once on mount. The context setters are stable in
  // behaviour, so this intentionally runs a single time.
  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }
    // Verify token is still valid
    customerAuthService.getMe(token)
      .then(() => {
        setLoggedIn(true);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("customer_token");
        setShowLoginModal(true);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = () => {
    // The customer logged in from the checkout flow: close the modal in place
    // (pushing "/checkout" again would not remount this client component) and
    // let the checkout render. Also dismiss the shared shell login modal.
    setShowLoginModal(false);
    setLoading(false);
    setLoggedIn(true);
    closeLoginModal();
    router.refresh();
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (showLoginModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          onClose={handleCloseLogin}
          required={true}
          redirectUrl="/checkout"
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return <CheckoutPageView />;
}

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}