/**
 * Analytics facade - the single public entry point for tracking events.
 *
 * Components import `useAnalytics` and call `track("event_name", props)`.
 * The implementation decides which provider (GA4, noop, etc.) to use based
 * on environment configuration. Components never import a provider directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnalyticsProvider, StandardEventName, EventPropertyMap } from "./events";
import { ga4Provider } from "./ga4";
import { noopProvider } from "./events";

/**
 * Get the active analytics provider based on environment configuration.
 * Returns the GA4 provider if a measurement ID is configured, otherwise
 * a no-op provider that silently discards all events.
 */
function getActiveProvider(): AnalyticsProvider {
  // Only initialize GA4 on the client side
  if (typeof window === "undefined") {
    return noopProvider;
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
    return ga4Provider;
  }

  return noopProvider;
}

/**
 * React hook for tracking analytics events.
 *
 * Usage:
 *   const { track } = useAnalytics();
 *   track("view_item", { item_id: "123", item_name: "Product", price: 100, currency: "BDT" });
 *
 * Returns an object with:
 * - track: function to dispatch an event
 * - isEnabled: whether analytics is currently active
 */
export function useAnalytics() {
  const providerRef = useRef<AnalyticsProvider>(getActiveProvider());
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const provider = getActiveProvider();
    providerRef.current = provider;
    // Use a timeout to avoid setting state synchronously in effect
    setTimeout(() => setIsEnabled(provider.isEnabled()), 0);
    provider.init();
  }, []);

  const track = useCallback(
    <T extends StandardEventName>(eventName: T, properties: EventPropertyMap[T]) => {
      const provider = providerRef.current;
      if (!provider) return;
      provider.track(eventName, properties);
    },
    []
  );

  return {
    track,
    isEnabled,
  };
}

/**
 * Convenience hook for tracking page views.
 * Use in page components that need to report a page_view event.
 */
export function usePageView() {
  const { isEnabled } = useAnalytics();
  const pathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isEnabled) return;

    const path = window.location.pathname + window.location.search;
    if (path === pathRef.current) return;
    pathRef.current = path;

    // GA4 sends page_view automatically on config, but we can also send it manually
    // for SPAs where the URL changes without a full page load.
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: window.location.pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [isEnabled]);
}

/**
 * Hook for tracking e-commerce events with proper typing.
 * Provides type-safe event tracking for standard e-commerce events.
 */
export function useEcommerceTracking() {
  const { track, isEnabled } = useAnalytics();

  const trackEvent = useCallback(
    <T extends StandardEventName>(eventName: T, properties: EventPropertyMap[T]) => {
      if (!isEnabled) return;
      track(eventName, properties);
    },
    [isEnabled, track]
  );

  return { trackEvent, isEnabled };
}