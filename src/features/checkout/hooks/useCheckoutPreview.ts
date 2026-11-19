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
  /** requestKey the stored status/totals were computed for. */
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [rulesFailed, setRulesFailed] = useState(false);
  const [rulesAttempt, setRulesAttempt] = useState(0);
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

  // Load the delivery-rules list once per attempt (not on every rule change).
  // A failure surfaces as an error the customer can retry via `refresh`.
  useEffect(() => {
    let cancelled = false;
    fetchDeliveryRules()
      .then((result) => {
        if (cancelled) return;
        setRulesFailed(false);
        setRules(result);
        // Default to highest price (first in DESC sort), keeping any choice
        // the customer already made.
        setSelectedRuleId((current) => current ?? result[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setRulesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [rulesAttempt]);

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
      setResultKey(requestKey);
      setStatus("ready");
    } catch (error) {
      if (latestKeyRef.current !== requestKey) return;

      setTotals(null);
      setResultKey(requestKey);

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

  const refresh = useCallback(async () => {
    if (rulesFailed) {
      setRulesAttempt((n) => n + 1);
      return;
    }
    await run();
  }, [rulesFailed, run]);

  if (enabled && items.length > 0 && rulesFailed) {
    return {
      status: "error",
      totals: null,
      message: "We couldn't load the delivery options. Please try again.",
      rules,
      selectedRuleId,
      setSelectedRuleId,
      needsLocation,
      refresh,
    };
  }

  // Active when there are items, a rule is selected, and enabled.
  // Location is NOT required for delivery calculation - only for order placement.
  const isActive = enabled && items.length > 0 && selectedRuleId !== null;
  // Inputs changed since the stored result (e.g. during the debounce window):
  // the old totals must not be presented as current or be submittable.
  const isStale = status !== "calculating" && resultKey !== requestKey;

  return {
    status: !isActive ? "idle" : isStale ? "calculating" : status,
    totals: isActive && !isStale ? totals : null,
    message: isActive && !isStale ? message : null,
    rules,
    selectedRuleId,
    setSelectedRuleId,
    needsLocation,
    refresh,
  };
}