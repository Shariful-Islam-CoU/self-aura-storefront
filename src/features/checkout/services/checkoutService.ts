/**
 * Checkout service - the only place the storefront talks to the backend
 * Order API.
 *
 * Flow:  CheckoutPageView -> checkoutService.createOrder -> api client -> POST /api/orders
 *
 * The cart is NOT trusted for prices, stock or totals: we send only product
 * ids + quantities plus the customer's delivery details (createOrderSchema
 * shape). The backend re-reads current prices/stock, computes item subtotals
 * and the final total, assigns the real order number (SA-...) and deducts
 * stock inside a transaction. All failures are mapped to customer-friendly
 * messages - raw backend errors never reach the UI.
 */
import { api, ApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type { CreateOrderRequest, OrderPaymentMethod, OrderResponse } from "@/types/order";
import type { CartItem } from "@/features/cart/types";
import type {
  CheckoutFormValues,
  CheckoutOrderError,
  CheckoutPaymentMethod,
} from "../types";
import { CHECKOUT_PAYMENT_METHODS, isManualPaymentMethod } from "../types";
import { normalizeBangladeshPhone } from "../lib/phone";

/**
 * Map a checkout payment method to the backend Order API enum value.
 * `cod` maps to `cash_on_delivery`; `bkash`/`nagad` are real backend values
 * now, so every checkout method is expressible in the wire shape.
 */
export function toBackendPaymentMethod(method: CheckoutPaymentMethod): OrderPaymentMethod {
  switch (method) {
    case "cod":
      return "cash_on_delivery";
    case "bkash":
      return "bkash";
    case "nagad":
      return "nagad";
  }
}

/** POST /api/orders success payload - the order lives under `data.order`. */
interface CreateOrderEnvelope {
  order?: unknown;
}

/** Runtime guard: keep the storefront from trusting a malformed payload. */
function isOrderResponse(value: unknown): value is OrderResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.orderNumber === "string" &&
    Array.isArray(candidate.items) &&
    typeof candidate.total === "number" &&
    typeof candidate.shippingAddress === "object" &&
    candidate.shippingAddress !== null
  );
}

/**
 * Build the exact public order request from the form + cart.
 *
 * Only what the customer controls is sent: product ids, quantities, the
 * structured delivery address and the payment claim. There are deliberately no
 * money fields - no subtotal, discount or delivery charge. The backend
 * re-reads prices, revalidates the coupon, uses the selected delivery rule and
 * computes the total itself, so anything the browser sent about price would be
 * ignored (and, on the public schema, rejected).
 *
 * For bKash/Nagad the customer's claimed transaction id (and optional sender
 * phone) are included; the backend requires the id for manual methods and
 * rejects it for COD. `customer` is omitted for guests - the backend supports
 * guest orders, and the storefront never fabricates a customer id.
 */
export function buildCreateOrderRequest(
  values: CheckoutFormValues,
  items: CartItem[],
  selectedRuleId?: string
): CreateOrderRequest {
  const { customer, address } = values;
  const note = address.deliveryNote.trim();
  const manual = isManualPaymentMethod(values.paymentMethod);
  const transactionId = manual ? values.manualPayment.transactionId.trim() : undefined;
  const senderPhone = manual ? values.manualPayment.senderPhone.trim() : undefined;

  return {
    items: items.map((item) => ({ product: item.product.id, quantity: item.quantity })),
    paymentMethod: toBackendPaymentMethod(values.paymentMethod),
    transactionId: transactionId || undefined,
    senderPhone: senderPhone || undefined,
    shippingAddress: {
      recipientName: customer.fullName.trim(),
      phone: normalizeBangladeshPhone(customer.phone),
      addressLine: address.addressLine.trim(),
      area: address.area.trim() || undefined,
      city: address.city.trim(),
      postalCode: address.postalCode.trim() || undefined,
      country: address.country.trim() || "Bangladesh",
      district: address.district.trim() || undefined
    },
    note: note || undefined,
    source: "website",
    selectedRuleId,
    ...(customer.facebookName?.trim()
      ? { facebookName: customer.facebookName.trim() }
      : {}),
    ...(customer.facebookProfileUrl?.trim()
      ? { facebookProfileUrl: customer.facebookProfileUrl.trim() }
      : {}),
  };
}

/** Place the order. Returns the backend-confirmed order (real order number). */
export async function createOrder(request: CreateOrderRequest, token?: string): Promise<OrderResponse> {
  const envelope = await api.post<ApiResponse<CreateOrderEnvelope> | null>("/public/orders", request, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  const order = envelope?.data?.order;
  if (!isOrderResponse(order)) {
    // The API answered but returned something unexpected - treat as a server
    // error rather than crashing the success flow with a fabricated order.
    throw new Error("Unexpected order response from the backend.");
  }
  return order;
}

const unavailableReview = (description: string): CheckoutOrderError => ({
  category: "unavailable-items",
  title: "Some items in your cart are no longer available",
  description,
  reviewCart: true,
});

/** Order handoff data for the success page. */
export interface OrderHandoff {
  order: OrderResponse;
  lineImages: string[];
  checkoutPaymentMethod: CheckoutPaymentMethod;
}

/** Persist the order handoff to sessionStorage for the success page. */
export function saveOrderHandoff(handoff: OrderHandoff): void {
  try {
    sessionStorage.setItem(ORDER_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Storage full/blocked - the success page still shows the order number
    // from the URL.
  }
}

/** Read the order handoff from sessionStorage. */
export function readOrderHandoff(): OrderHandoff | null {
  try {
    const raw = sessionStorage.getItem(ORDER_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrderHandoff>;
    if (!parsed.order || !isOrderResponse(parsed.order)) return null;
    return {
      order: parsed.order,
      lineImages: Array.isArray(parsed.lineImages) ? parsed.lineImages : [],
      // Handoffs written before manual methods existed only ever used COD.
      checkoutPaymentMethod: isCheckoutPaymentMethod(parsed.checkoutPaymentMethod)
        ? parsed.checkoutPaymentMethod
        : "cod",
    };
  } catch {
    return null;
  }
}

const ORDER_HANDOFF_KEY = "self_aura_order_handoff";

/** Type guard for checkout payment method. */
function isCheckoutPaymentMethod(value: unknown): value is CheckoutPaymentMethod {
  return value === "cod" || value === "bkash" || value === "nagad";
}

/** Map any thrown error to a customer-friendly CheckoutOrderError. */
export function toCheckoutOrderError(error: unknown): CheckoutOrderError {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
      case 403:
        return {
          category: "checkout-unavailable",
          title: "Checkout isn't available yet",
          description:
            "Self Aura hasn't switched on online checkout yet. Your cart is still safe in this browser - please try again later.",
          reviewCart: false,
        };
      case 409:
        return unavailableReview(
          "Some items in your cart aren't available in the requested quantity. Please review your cart before placing the order."
        );
      case 404:
        return unavailableReview(
          "Some items in your cart are no longer available. Please review your cart before placing the order."
        );
      default:
        return {
          category: "unknown",
          title: "Something went wrong",
          description: error.message || "An unexpected error occurred during checkout.",
          reviewCart: false,
        };
    }
  }
  return {
    category: "unknown",
    title: "Something went wrong",
    description: "An unexpected error occurred during checkout.",
    reviewCart: false,
  };
}