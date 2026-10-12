"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchDeliveryCoverage,
  fetchDeliveryRules,
  previewCheckout,
  type DeliveryLocationInput,
  type PublicDeliveryCoverage,
  type PublicDeliveryRule,
} from "../services/deliveryService";
import type { CheckoutPreviewTotals, CheckoutPreviewStatus } from "../types";

/** Debounce so typing an area does not fire a request per keystroke. */
const DEBOUNCE_MS = 400;

const isUsableLocation = (location: DeliveryLocationInput): boolean =>
  Boolean(location.district?.trim() || location.area?.trim());

export interface UseCheckoutPreviewResult {
  status: CheckoutPreviewStatus;
  totals: CheckoutPreviewTotals | null;
  /** Backend message when status is `unavailable`; safe to show to customers. */
  message: string | null;
  /** Distinct districts available for selection, for the address form. */
  districts: string[];
  /** Areas available under the selected district, if the backend lists any. */
  areas: string[];
  /**
   * Active delivery rules for the "Delivery charges" reference list
   * (Step 19A). Informational only - the quote, not this list, decides the fee.
   */
  rules: PublicDeliveryRule[];
  /** True when a location is needed but not yet entered. */
  needsLocation: boolean;
  /** Recalculates immediately; used on submit and after coupon changes. */
  refresh: () => Promise<void>;
}

/**
 * Keeps the checkout totals in sync with the backend.
 *
 * This hook is the storefront's only link to delivery pricing. It never
 * computes a subtotal, discount, fee or total: it sends the cart plus the
 * structured location to `POST /public/checkout/preview` and stores whatever
 * the backend returns. The `status` is what the submit button keys off, so an
 * order cannot be placed while the delivery charge is unknown, still loading,
 * or unresolved for the entered location.
 */
export function useCheckoutPreview(params: {
  items: Array<{ product: string; quantity: number }>;
  location: DeliveryLocationInput;
  couponCode?: string;
  /** Cart items have hydrated; do not calculate against an empty bag. */
  enabled: boolean;
}): UseCheckoutPreviewResult {
  const { items, location, couponCode, enabled } = params;

  const [status, setStatus] = useState<CheckoutPreviewStatus>("idle");
  const [totals, setTotals] = useState<CheckoutPreviewTotals | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<PublicDeliveryCoverage[]>([]);
  const [rules, setRules] = useState<PublicDeliveryRule[]>([]);

  /**
   * Identifies the exact inputs behind the currently stored result. Stale
   * responses are discarded rather than allowed to overwrite newer ones, which
   * is what stops a slow early request from showing an old fee for a new
   * address.
   */
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        items: items.map((item) => [item.product, item.quantity]),
        district: location.district ?? "",
        area: location.area ?? "",
        city: location.city ?? "",
        postalCode: location.postalCode ?? "",
        couponCode: couponCode ?? "",
      }),
    [items, location.district, location.area, location.city, location.postalCode, couponCode]
  );

  const latestKeyRef = useRef<string | null>(null);
  const needsLocation = enabled && !isUsableLocation(location);

  // Load coverage + the delivery-rules reference list once, in parallel, for the
  // address selectors and the "Delivery charges" view. Failure is non-fatal:
  // the customer can still type a location, and the preview remains the
  // authority on whether it is deliverable and what it costs.
  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([fetchDeliveryCoverage(), fetchDeliveryRules()]).then(
      ([coverageResult, rulesResult]) => {
        if (cancelled) return;
        if (coverageResult.status === "fulfilled") setCoverage(coverageResult.value);
        if (rulesResult.status === "fulfilled") setRules(rulesResult.value);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const districts = useMemo(() => {
    const names = new Set<string>();
    for (const zone of coverage) {
      for (const district of zone.districts) names.add(district);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [coverage]);

  const areas = useMemo(() => {
    const selected = location.district?.trim().toLowerCase();
    if (!selected) return [];

    const names = new Set<string>();
    for (const zone of coverage) {
      const coversDistrict = zone.districts.some(
        (district) => district.trim().toLowerCase() === selected
      );
      if (coversDistrict) {
        for (const area of zone.areas) names.add(area);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [coverage, location.district]);

  const run = useCallback(async () => {
    if (!enabled || items.length === 0) {
      setStatus("idle");
      setTotals(null);
      setMessage(null);
      return;
    }

    if (!isUsableLocation(location)) {
      // Not an error: the customer simply has not chosen a location yet.
      setStatus("idle");
      setTotals(null);
      setMessage(null);
      return;
    }

    latestKeyRef.current = requestKey;
    setStatus("calculating");

    try {
      const result = await previewCheckout({
        items,
        couponCode,
        location,
      });

      if (latestKeyRef.current !== requestKey) return;

      setTotals(result);
      setMessage(null);
      setStatus("ready");
    } catch (error) {
      if (latestKeyRef.current !== requestKey) return;

      setTotals(null);

      if (error instanceof ApiError && error.status === 400) {
        // The backend rejected the location itself - no active zone covers it.
        // Shown verbatim because the message is customer-safe by design.
        setStatus("unavailable");
        setMessage(error.message);
        return;
      }

      setStatus("error");
      setMessage(
        "We couldn't work out the delivery charge for this address. Please try again."
      );
    }
  }, [enabled, items, couponCode, location, requestKey]);

  // Debounced recalculation whenever any priced input changes. The effect only
  // schedules work; `run` owns the reset-to-idle cases so no state is set
  // synchronously during the effect (which React discourages). While a location
  // is not usable yet, the returned values below present an idle state instead
  // of stale totals.
  useEffect(() => {
    const timer = setTimeout(() => {
      void run();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [run]);

  // Only a complete, usable request is ever surfaced. This is derived at render
  // time so unusable inputs take effect immediately, without a state round-trip.
  const isActive = enabled && items.length > 0 && isUsableLocation(location);

  return {
    status: isActive ? status : "idle",
    totals: isActive ? totals : null,
    message: isActive ? message : null,
    districts,
    areas,
    rules,
    needsLocation,
    refresh: run,
  };
}