import { api, ApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type { CustomerOrder, CustomerOrderListData } from "@/types/order";

const API_BASE = "/customer";

export interface CustomerOrderParams {
  page?: number;
  limit?: number;
}

function isCustomerOrderLike(value: unknown): value is CustomerOrder {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.orderNumber === "string" &&
    Array.isArray((candidate as { items?: unknown }).items)
  );
}

/**
 * The backend envelopes success payloads as `{ success, message, data }`.
 * Unwrap tolerantly (single- or double-nested `data`, `orders` or `items`
 * keys, or a bare array) so a shape drift can never silently empty the list.
 */
function unwrapListData(raw: unknown): CustomerOrderListData {
  const root = raw as {
    data?: unknown;
    orders?: unknown;
    items?: unknown;
    pagination?: CustomerOrderListData["pagination"];
  } | null;

  const dataLevel = root?.data as
    | { data?: unknown; orders?: unknown; items?: unknown; pagination?: CustomerOrderListData["pagination"] }
    | unknown[]
    | undefined;

  const candidates: unknown[] = [root?.data, (dataLevel as { data?: unknown })?.data, raw];

  for (const candidate of candidates) {
    if (typeof candidate !== "object" || candidate === null) continue;
    if (Array.isArray(candidate)) {
      const orders = candidate.filter(isCustomerOrderLike);
      return {
        orders,
        pagination: {
          page: 1,
          limit: orders.length || 10,
          total: orders.length,
          totalPages: orders.length ? 1 : 0,
        },
      };
    }
    const c = candidate as {
      orders?: unknown;
      items?: unknown;
      pagination?: CustomerOrderListData["pagination"];
    };
    const list = Array.isArray(c.orders) ? c.orders : Array.isArray(c.items) ? c.items : null;
    if (list) {
      const orders = list.filter(isCustomerOrderLike);
      const pagination = c.pagination;
      const limit =
        typeof pagination?.limit === "number" ? pagination.limit : orders.length || 10;
      const total = typeof pagination?.total === "number" ? pagination.total : orders.length;
      return {
        orders,
        pagination: {
          page: typeof pagination?.page === "number" ? pagination.page : 1,
          limit,
          total,
          totalPages:
            typeof pagination?.totalPages === "number"
              ? pagination.totalPages
              : total > 0
                ? Math.max(1, Math.ceil(total / Math.max(1, limit)))
                : 0,
        },
      };
    }
  }

  return { orders: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
}

function unwrapOrderDetail(raw: unknown): CustomerOrder | null {
  const root = raw as Record<string, unknown> | null;
  const data = root?.data as Record<string, unknown> | undefined;
  const nested = data?.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [data?.order, nested?.order, data, raw];
  for (const candidate of candidates) {
    if (isCustomerOrderLike(candidate)) return candidate;
  }
  return null;
}

export const orderService = {
  /**
   * The signed-in customer's own orders (GET /api/customer/orders).
   *
   * The backend accepts only `page`/`limit` - ownership comes from the
   * session, so there is no status filter server-side. Filter by status in
   * the UI instead.
   */
  async getMyOrders(
    token: string,
    params: CustomerOrderParams = {}
  ): Promise<CustomerOrderListData> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = `${API_BASE}/orders${query ? `?${query}` : ""}`;

    try {
      const response = await api.get<ApiResponse<unknown>>(path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return unwrapListData(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error("Authentication required");
      }
      throw error;
    }
  },

  /**
   * One of the signed-in customer's own orders, by order number
   * (GET /api/customer/orders/:orderNumber).
   *
   * The shipment tracking (courier, tracking number, timeline) is embedded
   * on the response as `order.shipment` once the order has shipped - there
   * is no separate customer tracking endpoint. Another customer's order
   * number is a 404.
   */
  async getMyOrder(token: string, orderNumber: string): Promise<CustomerOrder> {
    try {
      const response = await api.get<unknown>(
        `${API_BASE}/orders/${encodeURIComponent(orderNumber)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const order = unwrapOrderDetail(response);
      if (!order) {
        throw new ApiError(502, "Malformed response from order API", response);
      }
      return order;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error("Authentication required");
      }
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Order not found");
      }
      throw error;
    }
  },
};
