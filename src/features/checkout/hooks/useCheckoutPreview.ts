"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchDeliveryRules,
  previewCheckout,
  type DeliveryLocationInput,
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
  /** Active delivery rules for the checkout page. Sorted by price descending (highest first). */
  rules: PublicDeliveryRule[];
  /** Currently selected rule ID. */
  selectedRuleId: string | null;
  /** Set the selected rule ID (customer changes delivery option). */
  setSelectedRuleId: (ruleId: string) => void;
  /** True when a location is needed for order placement (not for delivery calculation). */
  needsLocation: boolean;
  /** Recalculates immediately; used on submit and after coupon changes. */
  refresh: () => Promise<void>;
}

/**
 * Keeps the checkout totals in sync with the backend.
 *
 * Delivery charge is calculated based on the selected delivery rule.
 * Location is only required for order placement, not for delivery charge calculation.
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
  const [rules, setRules] = useState<PublicDeliveryRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

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
        selectedRuleId: selectedRuleId ?? "",
      }),
    [items, location.district, location.area, location.city, location.postalCode, couponCode, selectedRuleId]
  );

  const latestKeyRef = useRef<string | null>(null);
  const needsLocation = enabled && !isUsableLocation(location);

  // Load the delivery-rules reference list once for the checkout page.
  // Failure is non-fatal: the customer can still type a location, and the
  // preview remains the authority on whether it is deliverable and what it costs.
  useEffect(() => {
    let cancelled = false;
    void fetchDeliveryRules().then((result) => {
      if (cancelled) return;
      setRules(result);
      // Default to highest price (first in DESC sort)
      if (result.length > 0 && selectedRuleId === null) {
        setSelectedRuleId(result[0].id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedRuleId]);

  const run = useCallback(async () => {
    if (!enabled || items.length === 0) {
      setStatus("idle");
      setTotals(null);
      setMessage(null);
      return;
    }

    if (!selectedRuleId) {
      // No rule selected yet (should not happen if rules loaded)
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
        selectedRuleId,
      });

      if (latestKeyRef.current !== requestKey) return;

      setTotals(result);
      setMessage(null);
      setStatus("ready");
    } catch (error) {
      if (latestKeyRef.current !== requestKey) return;

      setTotals(null);

      if (error instanceof ApiError && error.status === 400) {
        // The backend rejected the location/rule - no active rule covers it.
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
  }, [enabled, items, couponCode, location, selectedRuleId, requestKey]);

  // Debounced recalculation whenever any priced input changes. The effect only
  // schedules work; `run` owns the reset-to-idle cases so no state is set
  // synchronously during the effect (which React discourages).
  useEffect(() => {
    const timer = setTimeout(() => {
      void run();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [run]);

  // Active when there are items, a rule is selected, and enabled.
  // Location is NOT required for delivery calculation - only for order placement.
  const isActive = enabled && items.length > 0 && selectedRuleId !== null;

  return {
    status: isActive ? status : "idle",
    totals: isActive ? totals : null,
    message: isActive ? message : null,
    rules,
    selectedRuleId,
    setSelectedRuleId,
    needsLocation,
    refresh: run,
  };
}