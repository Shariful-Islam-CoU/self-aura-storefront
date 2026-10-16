"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutPageView } from "@/features/checkout/components/CheckoutPageView";
import { LoginModal } from "@/components/ui/LoginModal";
import { customerAuthService } from "@/services/customerAuthService";

function CheckoutPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }
    // Verify token is still valid
    customerAuthService.getMe(token)
      .then(() => setLoading(false))
      .catch(() => {
        localStorage.removeItem("customer_token");
        setShowLoginModal(true);
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    router.refresh();
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    router.push("/");
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
        />
      </div>
    );
  }

  return <CheckoutPageView />;
}

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}