"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

/**
 * Set on the very first visit and read on every later one. The auto-opening
 * login dialog is reserved for returning visitors: a first-time visitor should
 * be able to look around before being asked to sign in.
 */
const HAS_VISITED_KEY = "has_visited_before";

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
  // Resolved once per mount. A ref (not state) so React's dev-mode StrictMode
  // double effect cannot turn the first visit into a "returning" one.
  const isReturningVisitor = useRef<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("customer_token");
      setIsLoggedIn(!!token);

      if (isReturningVisitor.current === null) {
        isReturningVisitor.current = localStorage.getItem(HAS_VISITED_KEY) === "true";
        localStorage.setItem(HAS_VISITED_KEY, "true");
      }

      // Show the login modal automatically only to visitors who have been here
      // before - never on their very first visit - and only if they are not
      // signed in and have not dismissed it.
      if (!isReturningVisitor.current) return;

      const dismissed = localStorage.getItem("login_modal_dismissed");
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