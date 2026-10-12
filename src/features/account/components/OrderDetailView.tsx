"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { CustomerOrder, OrderPaymentStatus, OrderPaymentMethod, OrderStatus } from "@/types/order";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
import { 
  CreditCard, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Mail,
  Phone,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface OrderDetailViewProps {
  order: CustomerOrder;
}

const statusConfig: Record<OrderStatus, { label: string; variant: BadgeProps["variant"]; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "warning", icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: "Confirmed", variant: "info", icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: "Processing", variant: "default", icon: <Package className="h-3 w-3" /> },
  ready_to_ship: { label: "Ready to Ship", variant: "info", icon: <Truck className="h-3 w-3" /> },
  shipped: { label: "Shipped", variant: "default", icon: <Truck className="h-3 w-3" /> },
  delivered: { label: "Delivered", variant: "success", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  returned: { label: "Returned", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

const paymentStatusConfig: Record<OrderPaymentStatus, { label: string; variant: BadgeProps["variant"] }> = {
  unpaid: { label: "Unpaid", variant: "warning" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  refunded: { label: "Refunded", variant: "destructive" },
};

const paymentMethodLabels: Record<OrderPaymentMethod, string> = {
  cash_on_delivery: "Cash on Delivery",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  bkash: "bKash",
  nagad: "Nagad",
  other: "Other",
};

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const status = statusConfig[order.orderStatus];
  const paymentStatus = paymentStatusConfig[order.paymentStatus];
  const shipment = order.shipment ?? null;

  return (
    <div className="space-y-8">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Order Details</p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={status.variant} className="gap-1 text-sm px-3 py-1">
            {status.icon}
            {status.label}
          </Badge>
          <Badge variant={paymentStatus.variant} className="text-sm px-3 py-1">
            {paymentStatus.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Order Items & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={`${item.sku}-${index}`} className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{item.productName}</h4>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatPrice(order.deliveryCharge)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Order Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <OrderTrackingTimeline
                orderStatus={order.orderStatus}
                shipment={shipment}
                orderCreatedAt={order.createdAt}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Info */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Method</p>
                <p className="font-medium capitalize">{paymentMethodLabels[order.paymentMethod]}</p>
              </div>
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Status</p>
                <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
              </div>
              {order.transactionId && (
                <div>
                  <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{order.transactionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <address className="not-italic space-y-1">
                <p className="font-medium">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine}</p>
                {order.shippingAddress.area && <p>{order.shippingAddress.area}</p>}
                <p>{order.shippingAddress.city}</p>
                {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
                {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
              </address>
            </CardContent>
          </Card>

          {/* Order Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Placed on</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.note && (
                <div>
                  <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Note</p>
                  <p className="text-sm">{order.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { BadgeProps } from "@/components/ui/Badge";