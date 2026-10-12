"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AccountUnavailableView } from "@/features/account/components/AccountUnavailableView";
import { OrderDetailView } from "@/features/account/components/OrderDetailView";
import { orderService } from "@/services/orderService";
import type { CustomerOrder } from "@/types/order";
import { Package } from "lucide-react";

interface OrderDetailClientProps {
  orderNumber: string;
}

type DetailState =
  | { status: "loading" }
  | { status: "requires-auth" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; order: CustomerOrder };

/**
 * Client-side order detail loader.
 *
 * The customer token only exists in browser localStorage, so a Server
 * Component can never read it (which is why the previous version always saw
 * `token: null`). The shipment tracking needs no second request: the backend
 * embeds it on the order detail response (`order.shipment`) once shipped.
 */
export function OrderDetailClient({ orderNumber }: OrderDetailClientProps) {
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem("customer_token");
    if (!token) {
      setState({ status: "requires-auth" });
      return;
    }

    orderService
      .getMyOrder(token, orderNumber)
      .then((order) => {
        if (!cancelled) setState({ status: "ready", order });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load order";
        if (message === "Authentication required") {
          setState({ status: "requires-auth" });
        } else if (message === "Order not found") {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (state.status === "loading") {
    return (
      <div className="w-full">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          Order {orderNumber}
        </h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (state.status === "requires-auth") {
    return (
      <AccountUnavailableView
        eyebrow="My orders"
        title={`Order ${orderNumber}`}
        description="Please sign in to view this order. An order is only ever shown to the customer who placed it."
      />
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="w-full">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          Order {orderNumber}
        </h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">This order was not found in your account.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may belong to a different account, or the order number may be incorrect.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/account/orders">Back to my orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="w-full">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          Order {orderNumber}
        </h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 text-center">
          <p className="text-sm font-medium">Unable to load this order.</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/account/orders">Back to my orders</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <OrderDetailView order={state.order} />;
}
