"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AnalyticsContextValue {
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics provider component.
 *
 * Initializes the active analytics provider (GA4 or noop) and provides
 * it via context. Wraps the application at the root level so all
 * components can access analytics via the useAnalytics hook.
 *
 * Must be a client component because it uses the GA4 script which
 * requires the window object.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Initialize the provider on the client side only
    if (typeof window !== "undefined") {
      const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
      const hasValidId = measurementId && /^G-[A-Z0-9]+$/.test(measurementId);

      if (hasValidId) {
        // Initialize GA4
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag(...args: unknown[]) {
          (window.dataLayer as unknown[]).push(args);
        };
        window.gtag("js", new Date());
        const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
        if (measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
          window.gtag("config", measurementId, {
            send_page_view: false,
          });
        }
        setTimeout(() => setIsEnabled(true), 0);
      } else {
        setTimeout(() => setIsEnabled(false), 0);
      }
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{ isEnabled }}>
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