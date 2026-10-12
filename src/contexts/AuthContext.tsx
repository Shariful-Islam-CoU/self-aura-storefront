"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  showLoginModal: boolean;
  loginRedirectUrl: string | null;
  openLoginModal: (required?: boolean, redirectUrl?: string) => void;
  closeLoginModal: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [loginRedirectUrl, setLoginRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("customer_token");
      const dismissed = localStorage.getItem("login_modal_dismissed");
      setIsLoggedIn(!!token);
      
      // Show login modal on first visit if not logged in and not dismissed
      if (!token && !dismissed) {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
          setShowLoginModal(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const openLoginModal = (required = false, redirectUrl?: string) => {
    setLoginRequired(required);
    setLoginRedirectUrl(redirectUrl ?? null);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginRedirectUrl(null);
    if (!loginRequired) {
      localStorage.setItem("login_modal_dismissed", "true");
    }
  };

  const setLoggedIn = (loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      setShowLoginModal(false);
      setLoginRedirectUrl(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        showLoginModal,
        loginRedirectUrl,
        openLoginModal,
        closeLoginModal,
        setLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}