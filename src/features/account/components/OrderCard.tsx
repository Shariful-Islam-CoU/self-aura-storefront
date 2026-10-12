"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { CustomerOrder, OrderPaymentStatus, OrderPaymentMethod, OrderStatus } from "@/types/order";
import { MapPin, Package, CreditCard, Truck, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface OrderCardProps {
  order: CustomerOrder;
  onViewDetails: (orderNumber: string) => void;
  onTrackOrder: (orderNumber: string) => void;
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

export function OrderCard({ order, onViewDetails, onTrackOrder }: OrderCardProps) {
  const status = statusConfig[order.orderStatus];
  const paymentStatus = paymentStatusConfig[order.paymentStatus];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
              <Badge variant={status.variant} className="gap-1">
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{formatPrice(order.total)}</p>
            <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </CardHeader>

      <Separator className="my-2" />

      <CardContent className="pt-3 pb-3">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Payment</p>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium capitalize">{paymentMethodLabels[order.paymentMethod]}</span>
            </div>
            <Badge variant={paymentStatus.variant} className="mt-1">
              {paymentStatus.label}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Shipping</p>
            <p className="text-sm font-medium">{order.shippingAddress.city}</p>
            <p className="text-xs text-muted-foreground">
              {order.shippingAddress.addressLine}
              {order.shippingAddress.area && `, ${order.shippingAddress.area}`}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Items</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {order.items.slice(0, 3).map((item, index) => (
                <span key={`${item.sku}-${index}`} className="text-xs bg-muted px-2 py-0.5 rounded">
                  {item.productName} × {item.quantity}
                </span>
              ))}
              {order.items.length > 3 && (
                <span className="text-xs text-muted-foreground px-2 py-0.5">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(order.orderNumber)}>
            View Details
          </Button>
          <Button variant="primary" size="sm" onClick={() => onTrackOrder(order.orderNumber)}>
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Track Order
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

import type { BadgeProps } from "@/components/ui/Badge";