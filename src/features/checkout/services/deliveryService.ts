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
 *   GET  /delivery-zones/customer/delivery-zones  - coverage list for the dropdowns
 *   GET  /delivery-zones/customer/delivery-rules  - active delivery charges (Step 19A)
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
}

/**
 * Customer-safe coverage list for building the district/area selectors.
 * Contains no zone codes, priorities, descriptions or audit fields.
 */
export interface PublicDeliveryCoverage {
  zoneName: string;
  baseDeliveryFee: number;
  freeDeliveryThreshold: number | null;
  districts: string[];
  areas: string[];
}

/**
 * One ACTIVE delivery rule as published for customers (Step 19A).
 *
 * Mirrors the backend `getPublicRules` output exactly: the customer-facing
 * name (English + optional Bangla), the covered district/area/country, an
 * optional description (English + Bangla), the charge that applies, and the
 * display order. It deliberately contains NO zone codes/ids, priorities,
 * creators or timestamps - those are internal. `charge: 0` is a real value
 * meaning "free delivery for this rule".
 */
export interface PublicDeliveryRule {
  name: string;
  nameBn?: string;
  district?: string;
  area?: string;
  country: string;
  description?: string;
  descriptionBn?: string;
  charge: number;
  displayOrder: number;
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
 * Loads the active delivery coverage so the checkout form can offer real
 * districts and areas instead of free text.
 *
 * Failure is non-fatal by design: the customer can still type an address, and
 * the preview request remains the authority on whether it is deliverable.
 */
export async function fetchDeliveryCoverage(): Promise<PublicDeliveryCoverage[]> {
  const response = await api.get<ApiResponse<{ zones: PublicDeliveryCoverage[] }>>(
    "/delivery-zones/customer/delivery-zones"
  );
  return dataOrThrow(response, "delivery coverage").zones ?? [];
}

/**
 * Loads the active delivery RULES for the "Delivery charges" view.
 *
 * What the customer sees and the fee the preview quotes always come from the
 * same backend rules; this list is informational (which areas cost what),
 * while the preview remains the authority on the actual charge. Failure is
 * non-fatal: checkout still works without the reference list.
 */
export async function fetchDeliveryRules(): Promise<PublicDeliveryRule[]> {
  const response = await api.get<ApiResponse<{ rules: PublicDeliveryRule[] }>>(
    "/delivery-zones/customer/delivery-rules"
  );
  return dataOrThrow(response, "delivery rules").rules ?? [];
}