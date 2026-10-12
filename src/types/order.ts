/**
 * Order wire types mirroring the Self Aura backend Order API
 * (self_aura_backend: types/order.ts, constants/order.ts and
 * validators/orderValidators.ts -> createOrderSchema).
 *
 * The backend is the single source of truth for prices, stock, order
 * numbers and totals. The storefront only sends product ids + quantities
 * and reads back the authoritative values - client-computed totals are
 * never trusted by the backend.
 */

export const ORDER_PAYMENT_METHODS = [
  "cash_on_delivery",
  "cash",
  "bank_transfer",
  "bkash",
  "nagad",
  "other",
] as const;
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

export const ORDER_SOURCES = ["facebook", "website", "manual", "other"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const ORDER_PAYMENT_STATUSES = [
  "unpaid",
  "partially_paid",
  "paid",
  "refunded",
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Shipping address as exchanged with POST /api/orders (createOrderSchema). */
export interface OrderShippingAddressInput {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  city: string;
  postalCode?: string;
  country?: string;
  district?: string;
}

/** Order line payload - only product id + quantity. No client prices/stock. */
export interface OrderItemInput {
  product: string;
  quantity: number;
}

/**
 * POST /public/orders request body.
 *
 * There are deliberately NO money fields - no `subtotal`, `discount` or
 * `deliveryCharge`. The backend re-reads prices, revalidates the coupon,
 * resolves the delivery zone and computes the total itself; the public schema
 * is designed so a customer cannot influence any of them.
 *
 * `customer` is omitted for guest checkout - the public endpoint resolves no
 * customer and the storefront never fabricates an id.
 *
 * For manual bKash/Nagad payments the backend REQUIRES `transactionId` (a
 * customer claim - the backend verifies it later) and accepts an optional
 * `senderPhone`. COD must NOT carry a transaction id.
 */
export interface CreateOrderRequest {
  items: OrderItemInput[];
  paymentMethod: OrderPaymentMethod;
  shippingAddress: OrderShippingAddressInput;
  /** Required by the backend for `bkash` / `nagad`; not allowed for COD. */
  transactionId?: string;
  /** Optional bKash/Nagad sender number (01XXXXXXXXX / +8801XXXXXXXXX). */
  senderPhone?: string;
  note?: string;
  source: OrderSource;
}

/** One order line as returned by the backend. */
export interface OrderItemResponse {
  id: string;
  product: { id: string };
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  /** Internal cost - never displayed to customers. */
  costPrice: number;
  subtotal: number;
}

export interface OrderCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface OrderShippingAddressResponse {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  district?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/**
 * Immutable delivery snapshot stored on the order at creation time.
 *
 * Read back as stored, never re-resolved against today's delivery zones, so an
 * order always shows the fee that was actually charged even after the zone is
 * edited or removed.
 */
export interface OrderDeliverySnapshot {
  id: string;
  code: string;
  name: string;
  baseCharge: number;
  charge: number;
  freeDeliveryApplied: boolean;
  freeDeliveryThreshold: number | null;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  matchedBy: string;
  district: string;
  area: string;
  postalCode: string;
}

export interface OrderCouponSnapshot {
  id: string;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

export interface OrderCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** Full order as returned by the backend (POST/GET order responses). */
export interface OrderResponse {
  id: string;
  orderNumber: string;
  customer: OrderCustomerRef;
  items: OrderItemResponse[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: OrderShippingAddressResponse;
  /** Absent only for orders created before delivery zones were resolved. */
  delivery?: OrderDeliverySnapshot;
  coupon?: OrderCouponSnapshot;
  /**
   * The customer's manual bKash/Nagad payment claim, returned by the backend.
   * It is a claim the customer submitted - never proof of payment - and is
   * only ever shown back to the customer who placed the order.
   */
  transactionId?: string;
  senderPhone?: string;
  note?: string;
  source: OrderSource;
  createdBy: OrderCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

/** Order list response (GET /api/orders) - orders plus backend pagination. */
export interface OrderListData {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Customer-safe order shapes mirroring the backend customer account API
 * (self_aura_backend: types/customerOrder.ts + utils/customerOrderMappers.ts).
 *
 * These are a strict allow-list subset of the management `OrderResponse`:
 * no `id`, no per-item `id`/`costPrice`, no `customer` ref (always the signed
 * in customer), no `createdBy`, no `source`, no `updatedAt`. The order detail
 * response additionally carries the shipment tracking inline (`shipment`)
 * once the order has been handed to a courier - there is no separate
 * customer tracking endpoint.
 */

/** One order line as returned by GET /api/customer/orders. No `id`. */
export interface CustomerOrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrderShippingAddress {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/** A single shipment timeline entry - status transition + date only. No `id`. */
export interface CustomerShipmentEvent {
  toStatus: string;
  createdAt: string;
}

export interface CustomerShipment {
  status: string;
  courierName?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  returnedAt?: string;
  failureReason?: string;
  events: CustomerShipmentEvent[];
}

/** One of the signed-in customer's own orders. */
export interface CustomerOrder {
  orderNumber: string;
  items: CustomerOrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: CustomerOrderShippingAddress;
  transactionId?: string;
  note?: string;
  createdAt: string;
  /** Present once the order has been handed to a courier. */
  shipment?: CustomerShipment | null;
}

/** Customer order list (GET /api/customer/orders) - orders plus pagination. */
export interface CustomerOrderListData {
  orders: CustomerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}