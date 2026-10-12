/**
 * Google Analytics 4 provider implementation.
 *
 * Only loads the GA4 script and dispatches events when a valid measurement ID
 * is provided via NEXT_PUBLIC_GA_MEASUREMENT_ID. If the ID is missing or
 * invalid, the provider gracefully degrades to a no-op.
 */

import { EventPropertyMap, StandardEventName } from "./events";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function getMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] NEXT_PUBLIC_GA_MEASUREMENT_ID is not a valid GA4 measurement ID (expected format G-XXXXXXXXXX). Analytics disabled.");
    }
    return null;
  }
  return id;
}

function ensureGtag(): void {
  if (typeof window !== "undefined" && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      (window.dataLayer as unknown[]).push(args);
    };
    window.gtag("js", new Date());
  }
}

function gtagEvent(eventName: string, parameters: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, parameters);
  }
}

/**
 * Map standard event names to GA4 event names and parameters.
 * GA4 uses specific event names and parameter names.
 */
function mapEvent<T extends StandardEventName>(
  eventName: T,
  properties: EventPropertyMap[T]
): { eventName: string; params: Record<string, unknown> } {
  switch (eventName) {
    case "view_item": {
      const props = properties as EventPropertyMap["view_item"];
      return {
        eventName: "view_item",
        params: {
          currency: props.currency,
          value: props.price,
          items: [
            {
              item_id: props.item_id,
              item_name: props.item_name,
              price: props.price,
              currency: props.currency,
              item_brand: props.item_brand,
              item_category: props.item_category,
              item_variant: props.item_variant,
            },
          ],
        },
      };
    }
    case "view_item_list": {
      const props = properties as EventPropertyMap["view_item_list"];
      return {
        eventName: "view_item_list",
        params: {
          item_list_id: props.item_list_id,
          item_list_name: props.item_list_name,
          items: props.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      };
    }
    case "search": {
      const props = properties as EventPropertyMap["search"];
      return {
        eventName: "search",
        params: {
          search_term: props.search_term,
        },
      };
    }
    case "add_to_cart": {
      const props = properties as EventPropertyMap["add_to_cart"];
      return {
        eventName: "add_to_cart",
        params: {
          currency: props.currency,
          value: props.price * props.quantity,
          items: [
            {
              item_id: props.item_id,
              item_name: props.item_name,
              price: props.price,
              quantity: props.quantity,
            },
          ],
        },
      };
    }
    case "remove_from_cart": {
      const props = properties as EventPropertyMap["remove_from_cart"];
      return {
        eventName: "remove_from_cart",
        params: {
          currency: props.currency,
          value: props.price * props.quantity,
          items: [
            {
              item_id: props.item_id,
              item_name: props.item_name,
              price: props.price,
              quantity: props.quantity,
            },
          ],
        },
      };
    }
    case "view_cart": {
      const props = properties as EventPropertyMap["view_cart"];
      return {
        eventName: "view_cart",
        params: {
          currency: props.currency,
          value: props.value,
          items: props.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      };
    }
    case "begin_checkout": {
      const props = properties as EventPropertyMap["begin_checkout"];
      return {
        eventName: "begin_checkout",
        params: {
          currency: props.currency,
          value: props.value,
          items: props.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
          })),
          coupon: props.coupon,
        },
      };
    }
    case "add_payment_info": {
      const props = properties as EventPropertyMap["add_payment_info"];
      return {
        eventName: "add_payment_info",
        params: {
          payment_type: props.payment_type,
        },
      };
    }
    case "purchase": {
      const props = properties as EventPropertyMap["purchase"];
      return {
        eventName: "purchase",
        params: {
          transaction_id: props.transaction_id,
          value: props.value,
          currency: props.currency,
          coupon: props.coupon,
          items: props.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      };
    }
    case "add_to_wishlist": {
      const props = properties as EventPropertyMap["add_to_wishlist"];
      return {
        eventName: "add_to_wishlist",
        params: {
          currency: props.currency ?? "BDT",
          value: props.price,
          items: [
            {
              item_id: props.item_id,
              item_name: props.item_name,
              price: props.price,
            },
          ],
        },
      };
    }
    case "login": {
      const props = properties as EventPropertyMap["login"];
      return {
        eventName: "login",
        params: {
          method: props.method,
        },
      };
    }
    case "sign_up": {
      const props = properties as EventPropertyMap["sign_up"];
      return {
        eventName: "sign_up",
        params: {
          method: props.method,
        },
      };
    }
    default:
      return { eventName, params: {} };
  }
}

/**
 * GA4 Analytics Provider.
 * Loads the GA4 script lazily and dispatches events via gtag.
 */
export const ga4Provider = {
  init() {
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    ensureGtag();
    window.gtag("config", measurementId, {
      send_page_view: false, // We send page_view manually where needed
    });
  },

  track<T extends StandardEventName>(eventName: T, properties: EventPropertyMap[T] | Record<string, unknown>): void {
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    ensureGtag();
    const { eventName: mappedEventName, params } = mapEvent(eventName, properties as EventPropertyMap[T]);
    gtagEvent(mappedEventName, params);
  },

  setUserProperties(properties: Record<string, unknown>): void {
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    ensureGtag();
    window.gtag("set", "user_properties", properties);
  },

  reset(): void {
    const measurementId = getMeasurementId();
    if (!measurementId) return;

    ensureGtag();
    window.gtag("set", "user_id", "");
  },

  isEnabled(): boolean {
    return getMeasurementId() !== null;
  },
};