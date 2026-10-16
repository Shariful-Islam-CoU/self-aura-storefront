"use client";

import { Suspense, useEffect, useState } from "react";
import { OrderListView } from "@/features/account/components/OrderListView";
import { LoadingState } from "@/components/ui/LoadingState";
import { orderService } from "@/services/orderService";
import type { CustomerOrderListData } from "@/types/order";

interface OrdersPageState {
  ordersData: CustomerOrderListData | null;
  loading: boolean;
  requiresAuth: boolean;
  loadError: string | null;
}

export default function OrdersPage() {
  const [state, setState] = useState<OrdersPageState>({
    ordersData: null,
    loading: true,
    requiresAuth: false,
    loadError: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setState({ ordersData: null, loading: false, requiresAuth: true, loadError: null });
      return;
    }

    orderService.getMyOrders(token, { page: 1, limit: 10 })
      .then((data) => {
        setState({ ordersData: data, loading: false, requiresAuth: false, loadError: null });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load orders";
        if (message === "Authentication required") {
          setState({ ordersData: null, loading: false, requiresAuth: true, loadError: null });
          return;
        }
        // Non-auth failure: still render the list view so it can show the
        // real error with a retry button instead of a misleading sign-in prompt.
        setState({ ordersData: null, loading: false, requiresAuth: false, loadError: message });
      });
  }, []);

  if (state.loading) {
    return (
      <div className="w-full">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          My orders
        </h1>
        <LoadingState label="Loading orders..." className="mt-8" />
      </div>
    );
  }

  if (state.requiresAuth) {
    return (
      <div className="w-full">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          My orders
        </h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm text-muted-foreground">
            Please sign in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
        My orders
      </h1>
      <Suspense fallback={<LoadingState label="Loading orders..." className="mt-8" />}>
        {state.ordersData ? (
          <OrderListView initialOrders={state.ordersData} />
        ) : (
          <OrderListView />
        )}
      </Suspense>
    </div>
  );
}