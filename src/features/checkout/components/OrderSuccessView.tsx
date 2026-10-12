"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, ShoppingBag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImageFrame } from "@/components/product/ProductImageFrame";
import { formatPrice } from "@/lib/utils/format";
import { readOrderHandoff } from "../services/checkoutService";
import type { OrderHandoff } from "../services/checkoutService";
import { CHECKOUT_PAYMENT_LABELS, isManualPaymentMethod } from "../types";
import type { CheckoutPaymentMethod } from "../types";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/features/account/constants";

/**
 * The customer-facing payment method for this order. Prefers the method the
 * customer actually chose at checkout (stored in the handoff); falls back to
 * a sensible default for old handoffs written before manual methods existed
 * (only COD was possible then).
 */
function resolveCheckoutPaymentMethod(method: CheckoutPaymentMethod | undefined): CheckoutPaymentMethod {
  if (method === "cod" || method === "bkash" || method === "nagad") return method;
  return "cod";
}

interface OrderSuccessViewProps {
  /** The real backend order number from the URL slug (never fabricated). */
  orderNumber: string;
}

/**
 * /order-success/[orderNumber] page body.
 *
 * Order details come from the order the backend just confirmed (passed via
 * sessionStorage - the backend has no public GET /orders/:id). Rendering is
 * client-side after mount, so a refresh in this tab keeps the details while
 * a deep link/other browser falls back to the order number in the URL.
 */
export function OrderSuccessView({ orderNumber }: OrderSuccessViewProps) {
  const [handoff, setHandoff] = useState<OrderHandoff | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // sessionStorage is a client-side external store - read it after mount
    // (one tick) so the server-rendered skeleton never mismatches.
    const id = window.setTimeout(() => {
      setHandoff(readOrderHandoff());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {!loaded ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-8 w-72" />
            <Skeleton className="mx-auto h-4 w-56" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : handoff ? (
          <SuccessContent handoff={handoff} />
        ) : (
          <SuccessFallback orderNumber={orderNumber} />
        )}
      </div>
    </Container>
  );
}

function SuccessContent({ handoff }: { handoff: OrderHandoff }) {
  const { order } = handoff;
  const paymentMethod = resolveCheckoutPaymentMethod(handoff.checkoutPaymentMethod);
  const manualPayment = isManualPaymentMethod(paymentMethod);
  const paymentMethodLabel =
    paymentMethod === "cod" ? PAYMENT_METHOD_LABELS.cash_on_delivery : CHECKOUT_PAYMENT_LABELS[paymentMethod];
  const recipientName = order.customer.name ?? order.shippingAddress.recipientName;
  const phone = order.shippingAddress.phone ?? order.customer.phone;
  const addressParts = [
    order.shippingAddress.addressLine,
    order.shippingAddress.area,
    order.shippingAddress.city,
    order.shippingAddress.postalCode,
    order.shippingAddress.country,
  ].filter((part): part is string => Boolean(part));

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-muted-foreground">
          {manualPayment
            ? "Your order has been placed and your payment is awaiting verification."
            : "Your order has been placed successfully."}
        </p>
        <Badge variant="accent" className="mt-4 px-3 py-1 text-sm">
          Order {order.orderNumber}
        </Badge>
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-border">
        <div className="grid gap-6 bg-card p-6 sm:grid-cols-2 sm:p-8">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </dt>
              <dd className="mt-1 text-foreground">{recipientName ?? "—"}</dd>
              {phone && <dd className="text-foreground">{phone}</dd>}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery
              </dt>
              <dd className="mt-1 leading-relaxed text-foreground">
                {addressParts.length > 0 ? addressParts.join(", ") : "—"}
              </dd>
            </div>
          </dl>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Payment method
              </dt>
              <dd className="mt-1 text-foreground">{paymentMethodLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Payment status
              </dt>
              <dd className="mt-1 text-foreground">
                {manualPayment
                  ? "Awaiting verification"
                  : PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </dd>
            </div>
            {order.transactionId && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transaction ID
                </dt>
                <dd className="mt-1 break-all text-foreground">{order.transactionId}</dd>
              </div>
            )}
            {order.senderPhone && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sender phone
                </dt>
                <dd className="mt-1 text-foreground">{order.senderPhone}</dd>
              </div>
            )}
          </dl>
        </div>

        {manualPayment && (
          <div className="border-t border-border bg-accent/5 px-6 py-4 sm:px-8">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                Your payment will be verified by Self Aura after your order is submitted. Your
                transaction id is not proof of payment.
              </span>
            </p>
          </div>
        )}

        <Separator />

        <ul className="divide-y divide-border bg-card px-6 sm:px-8">
          {order.items.map((item, index) => {
            const imageUrl = handoff.lineImages[index];
            return (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {/* The handoff images are whatever the cart held at checkout
                      time, so a stale URL is plausible - the frame's fallback
                      keeps the confirmation readable either way. */}
                  <ProductImageFrame
                    src={imageUrl}
                    alt={item.productName}
                    sizes="48px"
                    aspectRatio="6 / 7"
                    fallbackLabel="—"
                    className="h-14 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatPrice(item.subtotal)}
                </p>
              </li>
            );
          })}
        </ul>

        <Separator />

        <dl className="flex items-center justify-between gap-3 bg-card px-6 py-5 sm:px-8">
          <dt className="text-sm text-muted-foreground">
            {manualPayment ? "Total amount" : "Total to pay on delivery"}
          </dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatPrice(order.total)}
          </dd>
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}

function SuccessFallback({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingBag className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Order {orderNumber}
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
        We couldn&rsquo;t load the details for this order in this browser. If you just placed it,
        your confirmation may have opened in a different tab or window.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}