"use client";

import { Suspense, useSyncExternalStore } from "react";
import { OrderListView } from "@/features/account/components/OrderListView";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * My orders.
 *
 * The page only decides whether the customer is signed in. Fetching (with the
 * URL's page/status, loading skeletons, errors and retry) is owned entirely by
 * `OrderListView`, so there is one request per view and no error is dropped.
 */
type AuthState = "checking" | "signed-in" | "signed-out";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readAuthState(): AuthState {
  try {
    return localStorage.getItem("customer_token") ? "signed-in" : "signed-out";
  } catch {
    return "signed-out";
  }
}

export default function OrdersPage() {
  const authState = useSyncExternalStore(subscribeToStorage, readAuthState, () => "checking" as const);

  return (
    <div className="w-full">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My orders</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
        My orders
      </h1>
      {authState === "checking" ? (
        <LoadingState label="Loading orders..." className="mt-8" />
      ) : authState === "signed-out" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm text-muted-foreground">Please sign in to view your orders.</p>
        </div>
      ) : (
        <Suspense fallback={<LoadingState label="Loading orders..." className="mt-8" />}>
          <OrderListView />
        </Suspense>
      )}
    </div>
  );
}
