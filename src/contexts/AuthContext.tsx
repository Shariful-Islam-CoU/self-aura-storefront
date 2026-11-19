"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CUSTOMER_TOKEN_KEY } from "@/lib/auth/customerToken";

/**
 * Set on the very first visit and read on every later one. The auto-opening
 * login dialog is reserved for returning visitors: a first-time visitor should
 * be able to look around before being asked to sign in.
 */
const HAS_VISITED_KEY = "has_visited_before";
/**
 * Per-tab-session record of whether this session STARTED as a first visit.
 * The provider is mounted by more than one layout ((store) and /account), so
 * it remounts during navigation; without this, the second mount would read
 * the flag the first mount just wrote and treat a brand-new visitor as
 * returning.
 */
const SESSION_VISIT_KEY = "self_aura.session_visit";
const DISMISSED_KEY = "login_modal_dismissed";

/* Storage can throw (Safari with cookies blocked, some private modes). */
function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(storage: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Storage unavailable - the session simply isn't remembered.
  }
}
const local = () => window.localStorage;
const session = () => window.sessionStorage;

function resolveReturningVisitor(): boolean {
  const recorded = readStorage(session, SESSION_VISIT_KEY);
  if (recorded === "first" || recorded === "returning") {
    return recorded === "returning";
  }
  const returning = readStorage(local, HAS_VISITED_KEY) === "true";
  writeStorage(session, SESSION_VISIT_KEY, returning ? "returning" : "first");
  writeStorage(local, HAS_VISITED_KEY, "true");
  return returning;
}

interface AuthContextType {
  isLoggedIn: boolean;
  showLoginModal: boolean;
  loginRedirectUrl: string | null;
  openLoginModal: (required?: boolean, redirectUrl?: string) => void;
  closeLoginModal: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
  /** Clears the stored session and flips the signed-in state. */
  signOut: () => void;
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
    const token = readStorage(local, CUSTOMER_TOKEN_KEY);
    setIsLoggedIn(!!token);

    if (isReturningVisitor.current === null) {
      isReturningVisitor.current = resolveReturningVisitor();
    }

    // Show the login modal automatically only to visitors who have been here
    // before - never on their very first visit - and only if they are not
    // signed in and have not dismissed it.
    if (!isReturningVisitor.current) return;

    const dismissed = readStorage(local, DISMISSED_KEY);
    if (!token && !dismissed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const openLoginModal = useCallback((required = false, redirectUrl?: string) => {
    setLoginRequired(required);
    setLoginRedirectUrl(redirectUrl ?? null);
    setShowLoginModal(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setLoginRedirectUrl(null);
    // Only a real dismissal (not closing after a successful sign-in) should
    // stop the dialog from auto-opening in future.
    if (!loginRequired && !readStorage(local, CUSTOMER_TOKEN_KEY)) {
      writeStorage(local, DISMISSED_KEY, "true");
    }
  }, [loginRequired]);

  const setLoggedIn = useCallback((loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      setShowLoginModal(false);
      setLoginRedirectUrl(null);
    }
  }, []);

  const signOut = useCallback(() => {
    writeStorage(local, CUSTOMER_TOKEN_KEY, null);
    setIsLoggedIn(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isLoggedIn,
      showLoginModal,
      loginRedirectUrl,
      openLoginModal,
      closeLoginModal,
      setLoggedIn,
      signOut,
    }),
    [isLoggedIn, showLoginModal, loginRedirectUrl, openLoginModal, closeLoginModal, setLoggedIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
