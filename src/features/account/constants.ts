/**
 * Customer-facing labels and presentation hints for the backend's order,
 * payment and shipment status values.
 *
 * Values mirror the real backend enums (self_aura_backend: constants/order.ts,
 * constants/payment.ts and constants/shipment.ts) - the storefront never
 * changes backend statuses and never invents new ones. Unknown values are
 * never silently mapped: callers should fall back to the raw value so a
 * customer is never shown a wrong label.
 */

import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from "@/types/order";
import type { DeliveryFailureReason, ShipmentStatus } from "@/types/shipment";

/**
 * Badge variants available on the shared UI Badge component. Kept as an
 * independent union so status maps can drive badges without reaching into
 * component props.
 */
export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "accent"
  | "success"
  | "warning"
  | "destructive"
  | "info";

export const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  cash_on_delivery: "Cash on Delivery",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  bkash: "bKash",
  nagad: "Nagad",
  other: "Other",
};

export const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  unpaid: "Unpaid — awaiting payment",
  partially_paid: "Partially paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_VARIANTS: Record<OrderPaymentStatus, StatusBadgeVariant> = {
  unpaid: "warning",
  partially_paid: "warning",
  paid: "success",
  refunded: "secondary",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ORDER_STATUS_VARIANTS: Record<OrderStatus, StatusBadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  ready_to_ship: "info",
  shipped: "accent",
  delivered: "success",
  cancelled: "destructive",
  returned: "secondary",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  in_transit: "In transit",
  delivered: "Delivered",
  delivery_failed: "Delivery failed",
  returned_to_seller: "Returned to seller",
  cancelled: "Cancelled",
};

export const SHIPMENT_STATUS_VARIANTS: Record<ShipmentStatus, StatusBadgeVariant> = {
  pending: "warning",
  ready_to_ship: "info",
  shipped: "accent",
  in_transit: "info",
  delivered: "success",
  delivery_failed: "destructive",
  returned_to_seller: "secondary",
  cancelled: "destructive",
};

export const DELIVERY_FAILURE_REASON_LABELS: Record<DeliveryFailureReason, string> = {
  customer_unavailable: "Customer unavailable",
  wrong_address: "Wrong address",
  customer_refused: "Customer refused delivery",
  phone_unreachable: "Phone unreachable",
  courier_issue: "Courier issue",
  other: "Other",
};