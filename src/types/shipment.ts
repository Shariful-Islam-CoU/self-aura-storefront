/**
 * Shipment and tracking wire types mirroring the Self Aura backend Shipment
 * API (self_aura_backend: types/shipment.ts and constants/shipment.ts).
 *
 * Today every shipment endpoint is management-auth + permission gated - the
 * backend has no customer-facing tracking API yet. These types are the
 * storefront's copy of the real backend contract so a customer-safe tracking
 * view (order details, courier, tracking number, timeline) can be wired
 * directly to the backend response shapes when that API exists. The backend
 * remains the source of truth for every tracking value.
 */

export const SHIPMENT_STATUSES = [
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "delivered",
  "delivery_failed",
  "returned_to_seller",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const DELIVERY_FAILURE_REASONS = [
  "customer_unavailable",
  "wrong_address",
  "customer_refused",
  "phone_unreachable",
  "courier_issue",
  "other",
] as const;
export type DeliveryFailureReason = (typeof DELIVERY_FAILURE_REASONS)[number];

export interface ShipmentOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
  orderStatus?: string;
}

export interface ShipmentCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface ShipmentCourierRef {
  id: string;
  name?: string;
  phone?: string;
}

export interface ShipmentActorRef {
  id: string;
  username?: string;
  role?: string;
}

export interface ShippingAddressResponse {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ShipmentResponse {
  id: string;
  shipmentNumber: string;
  order: ShipmentOrderRef;
  customer: ShipmentCustomerRef;
  courier: ShipmentCourierRef;
  trackingNumber?: string;
  deliveryCharge: number;
  shippingAddress: ShippingAddressResponse;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  returnedAt?: string;
  failureReason?: DeliveryFailureReason;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEventResponse {
  id: string;
  shipment: string;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
}

export interface ShipmentListData {
  shipments: ShipmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}