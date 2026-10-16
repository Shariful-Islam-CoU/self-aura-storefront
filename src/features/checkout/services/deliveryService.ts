/**
 * Storefront delivery/checkout service.
 *
 * The storefront performs NO delivery or total arithmetic of its own. It sends
 * product ids, quantities, an optional coupon code and a structured location to
 * the backend and renders whatever comes back. That is deliberate: if the
 * browser computed a fee, a customer could edit it in devtools, and the
 * preview would no longer be a promise about what they will be charged.
 *
 * Endpoints used (all public, all on the same backend authority):
 *   POST /public/checkout/preview             - authoritative full calculation
 *   GET  /delivery-rules/customer/delivery-rules  - active delivery rules (simplified)
 */
import { api, ApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type { CheckoutPreviewTotals } from "../types";

/** Structured delivery location as the backend's matching rules expect it. */
export interface DeliveryLocationInput {
  district?: string;
  area?: string;
  city?: string;
  postalCode?: string;
}

export interface CheckoutPreviewRequest {
  items: Array<{ product: string; quantity: number }>;
  couponCode?: string;
  location: DeliveryLocationInput;
  selectedRuleId?: string;
}

/**
 * One ACTIVE delivery rule as published for customers (simplified).
 *
 * Mirrors the backend `getPublicRules` output exactly: the rule id, name, price,
 * and ETA. No district/area/country matching - customer self-selects.
 * `price: 0` means "free delivery for this rule".
 */
export interface PublicDeliveryRule {
  id: string;
  name: string;
  price: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
}

function dataOrThrow<T>(payload: ApiResponse<T> | null | undefined, label: string): T {
  if (!payload || payload.data === undefined || payload.data === null) {
    throw new ApiError(502, `Malformed ${label} response from the backend.`);
  }
  return payload.data;
}

/**
 * Requests the authoritative checkout calculation.
 *
 * Throws on failure rather than returning a partial result, so the caller can
 * never render a total the backend did not produce. `ApiError` carries the
 * backend status, which is how the caller distinguishes "no zone covers this
 * location" (400) from a transient network problem.
 */
export async function previewCheckout(
  request: CheckoutPreviewRequest
): Promise<CheckoutPreviewTotals> {
  const response = await api.post<ApiResponse<CheckoutPreviewTotals>>(
    "/public/checkout/preview",
    request
  );
  return dataOrThrow(response, "checkout preview");
}

/**
 * Loads the active delivery RULES for the checkout page.
 *
 * What the customer sees and the fee the preview quotes always come from the
 * same backend rules; this list is informational (which rules cost what),
 * while the preview remains the authority on the actual charge. Failure is
 * non-fatal: checkout still works without the reference list.
 */
export async function fetchDeliveryRules(): Promise<PublicDeliveryRule[]> {
  const response = await api.get<ApiResponse<{ rules: PublicDeliveryRule[] }>>(
    "/delivery-rules/customer/delivery-rules"
  );
  return dataOrThrow(response, "delivery rules").rules ?? [];
}