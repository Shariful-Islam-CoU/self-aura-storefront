/**
 * Public payment-settings service - the storefront's only source of merchant
 * payment configuration.
 *
 * Merchant bKash/Nagad numbers and the enabled/disabled state of every
 * payment method come from the backend's public endpoint
 * `GET /api/public/payment-settings` (managed in the Management App). They
 * are NEVER hardcoded in the storefront and NEVER read from env here: a
 * number is public by nature (customers need it to send money), but a
 * disabled method is simply not offered.
 *
 * Response shape (public.routes.ts -> paymentSettingsService.getPublicSettings):
 *
 *   {
 *     bkash: { enabled: boolean, number: string },   // number only when enabled
 *     nagad: { enabled: boolean, number: string },
 *     cod:   { enabled: boolean }
 *   }
 */
import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export interface PaymentChannelPublicSettings {
  enabled: boolean;
  /** Merchant receiving number - empty string when the channel is disabled. */
  number: string;
}

export interface PublicPaymentSettings {
  bkash: PaymentChannelPublicSettings;
  nagad: PaymentChannelPublicSettings;
  cod: { enabled: boolean };
}

/**
 * Safe fallback used until (or when) the backend settings cannot be fetched:
 * Cash on Delivery stays available because it needs no merchant number;
 * manual bKash/Nagad are withheld because their instruction numbers are
 * unknown. The checkout surfaces a clear "couldn't load payment options"
 * notice with a retry so nobody silently loses a method.
 */
export const FALLBACK_PUBLIC_PAYMENT_SETTINGS: PublicPaymentSettings = {
  bkash: { enabled: false, number: "" },
  nagad: { enabled: false, number: "" },
  cod: { enabled: true },
};

/** Runtime guard - never trust a malformed payload. */
function isPublicPaymentSettings(value: unknown): value is PublicPaymentSettings {
  if (typeof value !== "object" || value === null) return false;
  const channel = (candidate: unknown, key: string): boolean => {
    if (typeof candidate !== "object" || candidate === null) return false;
    const record = candidate as Record<string, unknown>;
    return (
      typeof record.enabled === "boolean" &&
      (key === "cod" || typeof record.number === "string")
    );
  };
  const record = value as Record<string, unknown>;
  return (
    channel(record.bkash, "bkash") &&
    channel(record.nagad, "nagad") &&
    channel(record.cod, "cod")
  );
}

/**
 * Fetch the customer-safe payment configuration from the backend.
 * Throws on failure or on an unexpected payload shape - the caller decides
 * how to degrade (the checkout falls back to FALLBACK_PUBLIC_PAYMENT_SETTINGS).
 */
export async function fetchPublicPaymentSettings(): Promise<PublicPaymentSettings> {
  const envelope = await api.get<ApiResponse<PublicPaymentSettings> | null>(
    "/public/payment-settings"
  );
  const settings = envelope?.data;
  if (!isPublicPaymentSettings(settings)) {
    throw new Error("Unexpected payment settings response from the backend.");
  }
  return settings;
}