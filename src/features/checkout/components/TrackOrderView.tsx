"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Package, Search, UserRound } from "lucide-react";

/**
 * Public order-tracking entry point.
 *
 * There is intentionally no guest tracking API call here: the backend has no
 * guest tracking endpoint (guest checkout is disabled - every order belongs
 * to a signed-in customer), so POST /api/guest/orders/track is a guaranteed
 * 404. Instead the customer enters their order number and is taken to the
 * authenticated order page, where ownership is enforced server-side and the
 * full timeline + shipment tracking is shown.
 */
export function TrackOrderView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [isSignedIn] = useState(() =>
    typeof window !== "undefined" ? Boolean(localStorage.getItem("customer_token")) : false
  );

  const goToOrder = () => {
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    router.push(`/account/orders/${encodeURIComponent(trimmed)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      goToOrder();
    }
  };

  return (
    <Container className="py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-medium tracking-tight">Track Your Order</h1>
          <p className="text-muted-foreground mt-2">
            Enter your order number to see its live status and delivery tracking.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="track-order-number">
                Order Number
              </label>
              <Input
                id="track-order-number"
                placeholder="e.g. SA-000001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                You&apos;ll find this in your order confirmation and in{" "}
                <Link href="/account/orders" className="underline underline-offset-2">
                  My orders
                </Link>
                .
              </p>
            </div>
            <Button
              onClick={goToOrder}
              disabled={!orderNumber.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Search className="h-4 w-4 mr-2" />
              View Order Status
            </Button>

            {!isSignedIn && (
              <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
                <UserRound className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Not signed in?</p>
                  <p className="text-muted-foreground">
                    Orders are only ever shown to the customer who placed them.{" "}
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/account/orders/${orderNumber.trim() || ""}`)}`}
                      className="underline underline-offset-2"
                    >
                      Sign in
                    </Link>{" "}
                    to continue to your order.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
