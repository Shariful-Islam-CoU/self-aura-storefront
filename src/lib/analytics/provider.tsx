"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { ga4Provider } from "./ga4";

interface AnalyticsContextValue {
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// Read literally so Next.js inlines it into the browser bundle.
const RAW_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const MEASUREMENT_ID = /^G-[A-Z0-9]+$/.test(RAW_MEASUREMENT_ID) ? RAW_MEASUREMENT_ID : null;

/**
 * Analytics provider, mounted once at the root.
 *
 * When a valid GA4 measurement id is configured it loads gtag.js, initialises
 * the GA4 provider exactly once, and reports a `page_view` on every
 * client-side navigation (the App Router never reloads the page, so GA's
 * automatic page view would only ever fire for the landing page).
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!MEASUREMENT_ID) return;
    ga4Provider.init();
  }, []);

  useEffect(() => {
    if (!MEASUREMENT_ID || typeof window.gtag !== "function") return;
    const path = window.location.pathname + window.location.search;
    if (path === lastPath.current) return;
    lastPath.current = path;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return (
    <AnalyticsContext.Provider value={{ isEnabled: MEASUREMENT_ID !== null }}>
      {MEASUREMENT_ID && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      )}
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalyticsContext must be used within an AnalyticsProvider");
  }
  return context;
}
