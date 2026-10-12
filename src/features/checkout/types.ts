/**
 * Checkout feature types.
 *
 * The checkout collects exactly the information the backend Order API needs:
 * customer (full name + Bangladesh phone), a delivery address and a payment
 * method. No email is required - the order payload has no email field and
 * Self Aura should not collect one unnecessarily. The backend remains the
 * source of truth for prices, stock, totals and order creation; everything
 * shown here is for customer convenience and review only.
 */

/** Customer/recipient contact details (map to shippingAddress.recipientName + phone). */
export interface CheckoutCustomerForm {
  fullName: string;
  /** Bangladesh mobile number - "01XXXXXXXXX" or "+8801XXXXXXXXX". */
  phone: string;
  facebookName?: string;
  facebookProfileUrl?: string;
}

/** Delivery address, matching the backend shippingAddress fields. */
export interface CheckoutAddressForm {
  addressLine: string;
  area: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  /** Optional delivery instructions -> order `note` (backend max 2000 chars). */
  deliveryNote: string;
}

/** Single default delivery option - the backend exposes no customer-selectable method. */
export const CHECKOUT_DELIVERY_METHODS = ["standard"] as const;
export type CheckoutDeliveryMethod = (typeof CHECKOUT_DELIVERY_METHODS)[number];

/**
 * Customer-facing payment methods offered by this checkout:
 *
 *   cod   - Cash on Delivery (no transaction id)
 *   bkash - manual bKash (customer sends money, submits a transaction id)
 *   nagad - manual Nagad (same flow)
 *
 * A customer-submitted transaction id is a CLAIM, never proof of payment:
 * the storefront only passes it along and Self Aura verifies it later. It is
 * never marked verified automatically.
 *
 * Which methods are actually offered is driven at runtime by the backend
 * public payment-settings endpoint (GET /api/public/payment-settings):
 * disabled channels are simply not shown, and manual instruction numbers
 * come from that endpoint - never hardcoded in the storefront.
 */
export const CHECKOUT_PAYMENT_METHODS = ["cod", "bkash", "nagad"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/** The manual-transfer methods — the ones that require a transaction id. */
export const CHECKOUT_MANUAL_PAYMENT_METHODS: readonly CheckoutPaymentMethod[] = [
  "bkash",
  "nagad",
];

export function isManualPaymentMethod(method: CheckoutPaymentMethod): boolean {
  return method === "bkash" || method === "nagad";
}

export const CHECKOUT_PAYMENT_LABELS: Record<CheckoutPaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
};

export const CHECKOUT_PAYMENT_DESCRIPTIONS: Record<CheckoutPaymentMethod, string> = {
  cod: "Pay when your order arrives. No advance payment needed.",
  bkash: "Pay manually using bKash.",
  nagad: "Pay manually using Nagad.",
};

/**
 * Transaction claim the customer submits for manual bKash/Nagad payments.
 *
 * This is a customer claim, not proof of payment: the transaction id is what
 * the customer says the transfer got. Self Aura verifies it after the order
 * is submitted. The storefront never stores PINs, OTPs, passwords or card
 * details — only the method, the transaction id and an optional sender phone.
 */
export interface ManualPaymentInfo {
  transactionId: string;
  /** Optional bKash/Nagad sender number (self-service convenience). */
  senderPhone: string;
}

/**
 * Coupon applied to the checkout.
 */
export interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountAmount: number;
}

/**
 * Authoritative delivery quote returned by the backend checkout preview.
 *
 * Mirrors `deliveryService.DeliveryQuote` on the backend. Every field here is
 * computed by the backend from the active Delivery Zone configuration — the
 * storefront performs no delivery maths of its own and cannot adjust any of
 * these values before submitting the order.
 */
export interface CalculatedDelivery {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  /** The coverage rule that selected the zone (postalCode / area / district …). */
  matchedBy: string;
  /** The configured fee before any free-delivery reduction. */
  baseDeliveryFee: number;
  /** What the customer is actually charged for delivery. */
  appliedDeliveryFee: number;
  freeDeliveryApplied: boolean;
  /** null when the zone does not offer free delivery. */
  freeDeliveryThreshold: number | null;
  estimatedMinDays: number;
  estimatedMaxDays: number;
}

/**
 * Authoritative checkout totals returned by the backend.
 *
 * The storefront never computes subtotal, discount, delivery fee or total: it
 * sends product ids + quantities and renders whatever these say.
 */
export interface CheckoutPreviewTotals {
  items: Array<{
    product: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  coupon: {
    id: string;
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null;
  delivery: CalculatedDelivery;
  total: number;
}

/** State of the in-flight backend calculation. */
export type CheckoutPreviewStatus =
  | "idle" // nothing requested yet
  | "calculating" // request in flight
  | "ready" // authoritative result available
  | "unavailable" // backend resolved no zone for this location
  | "error"; // request failed / cart changed under us

export interface CheckoutFormValues {
  customer: CheckoutCustomerForm;
  address: CheckoutAddressForm;
  deliveryMethod: CheckoutDeliveryMethod;
  paymentMethod: CheckoutPaymentMethod;
  /** Only meaningful while paymentMethod is bkash/nagad (cleared on switch). */
  manualPayment: ManualPaymentInfo;
  /** Applied coupon, if any. */
  coupon?: AppliedCoupon;
  /** Calculated delivery, if available. */
  delivery?: CalculatedDelivery;
}

/** Flat field names - easy to attach errors to labelled inputs. */
export type CheckoutField =
  | "fullName"
  | "phone"
  | "facebookName"
  | "facebookProfileUrl"
  | "addressLine"
  | "area"
  | "district"
  | "city"
  | "postalCode"
  | "country"
  | "deliveryNote"
  | "transactionId"
  | "senderPhone";

export type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

export interface CheckoutValidationResult {
  valid: boolean;
  errors: CheckoutFieldErrors;
}

/**
 * Customer-facing failure categories for order creation. Every backend
 * failure is mapped to one of these so the UI never shows raw errors.
 */
export type CheckoutOrderErrorCategory =
  | "unavailable-items" // stock / inactive / not-found -> review the cart
  | "checkout-unavailable" // the order API is auth-gated / guest support missing
  | "validation" // the request was rejected
  | "network" // connection / timeout
  | "server" // 5xx / unknown
  | "unknown"; // fallback for unmapped errors

export interface CheckoutOrderError {
  category: CheckoutOrderErrorCategory;
  title: string;
  description: string;
  /** True when the items must be reviewed before the order can be placed. */
  reviewCart: boolean;
}