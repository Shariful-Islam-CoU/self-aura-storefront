/**
 * Analytics event definitions and tracking utilities.
 *
 * This module provides a thin abstraction over the analytics provider so the
 * rest of the application never depends on a specific vendor. Swapping from
 * GA4 to another provider (or disabling analytics entirely) only requires
 * changes here and in the provider implementation - no component changes.
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

/**
 * Standard e-commerce event names (GA4-compatible).
 * Only events that map cleanly to real user actions are included.
 */
export const AnalyticsEvents = {
  /** Product detail page viewed. */
  view_item: "view_item",
  /** Product list/category page viewed. */
  view_item_list: "view_item_list",
  /** Search performed. */
  search: "search",
  /** Item added to cart. */
  add_to_cart: "add_to_cart",
  /** Item removed from cart. */
  remove_from_cart: "remove_from_cart",
  /** Cart viewed. */
  view_cart: "view_cart",
  /** Checkout started. */
  begin_checkout: "begin_checkout",
  /** Payment info added (manual methods). */
  add_payment_info: "add_payment_info",
  /** Order completed - ONLY fires after backend confirms order creation. */
  purchase: "purchase",
  /** Item added to wishlist. */
  add_to_wishlist: "add_to_wishlist",
  /** User signed in. */
  login: "login",
  /** User registered. */
  sign_up: "sign_up",
} as const;

/** Type of standard event names. */
export type StandardEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Properties for standard e-commerce events.
 * Only includes fields that can be reliably determined at fire time.
 */
export interface ViewItemProperties {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
}

export interface ViewItemListProperties {
  item_list_id?: string;
  item_list_name?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

export interface SearchProperties {
  search_term: string;
  results_count?: number;
}

export interface AddToCartProperties {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency: string;
}

export interface RemoveFromCartProperties {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency: string;
}

export interface ViewCartProperties {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

export interface BeginCheckoutProperties {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
  coupon?: string;
}

export interface AddPaymentInfoProperties {
  payment_type: "cod" | "bkash" | "nagad";
}

export interface PurchaseProperties {
  transaction_id: string;
  value: number;
  currency: string;
  coupon?: string;
  delivery_charge?: number;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

export interface AddToWishlistProperties {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
}

export interface LoginProperties {
  method: "email" | "phone";
}

export interface SignUpProperties {
  method: "email" | "phone";
}

/**
 * Map of event names to their property types.
 * Used for type-safe event dispatching.
 */
export interface EventPropertyMap {
  view_item: ViewItemProperties;
  view_item_list: ViewItemListProperties;
  search: SearchProperties;
  add_to_cart: AddToCartProperties;
  remove_from_cart: RemoveFromCartProperties;
  view_cart: ViewCartProperties;
  begin_checkout: BeginCheckoutProperties;
  add_payment_info: AddPaymentInfoProperties;
  purchase: PurchaseProperties;
  add_to_wishlist: AddToWishlistProperties;
  login: LoginProperties;
  sign_up: SignUpProperties;
}

/**
 * Analytics provider interface.
 * Implementations handle the actual provider-specific dispatch.
 */
export interface AnalyticsProvider {
  /** Initialize the provider (e.g., load GA4 script). */
  init(): void;
  /** Dispatch an event to the provider. */
  track<T extends StandardEventName>(
    eventName: T,
    properties: EventPropertyMap[T] | Record<string, unknown>
  ): void;
  /** Set user properties (e.g., user_id, user_tier). */
  setUserProperties(properties: Record<string, unknown>): void;
  /** Clear user data (e.g., on logout). */
  reset(): void;
  /** Check if analytics is enabled/initialized. */
  isEnabled(): boolean;
}

/**
 * No-op provider for when analytics is disabled.
 * All calls are no-ops so the application never breaks when analytics is off.
 */
export const noopProvider: AnalyticsProvider = {
  init() {},
  track() {},
  setUserProperties() {},
  reset() {},
  isEnabled() {
    return false;
  },
};

/**
 * Type guard for checking if a provider is the noop provider.
 */
export function isNoopProvider(provider: AnalyticsProvider): provider is typeof noopProvider {
  return provider === noopProvider;
}