"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { CheckCircle, Truck, Package, AlertCircle, MapPin, XCircle, Circle } from "lucide-react";
import type { CustomerShipment, CustomerShipmentEvent } from "@/types/order";

interface OrderTrackingTimelineProps {
  orderStatus: string;
  shipment?: CustomerShipment | null;
  orderCreatedAt: string;
}

const statusOrder = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "delivered",
];

const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  in_transit: "In Transit",
  delivered: "Delivered",
  delivery_failed: "Delivery Failed",
  returned_to_seller: "Returned to Seller",
  cancelled: "Cancelled",
  returned: "Returned",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Package className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  ready_to_ship: <Truck className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  in_transit: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  delivery_failed: <AlertCircle className="h-4 w-4" />,
  returned_to_seller: <AlertCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  returned: <AlertCircle className="h-4 w-4" />,
};

function formatStatusLabel(status: string): string {
  return statusLabels[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
}

export function OrderTrackingTimeline({ orderStatus, shipment, orderCreatedAt }: OrderTrackingTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(orderStatus);
  const isCancelled = orderStatus === "cancelled" || orderStatus === "returned";

  // The order itself never becomes `in_transit` - the backend keeps the order
  // at `shipped` while the parcel travels (see shipmentService.syncOrderStatus).
  // Promote the timeline from the *shipment* so a parcel that is actually in
  // transit shows "In Transit" as current instead of leaving it greyed out.
  const TRANSIT_INDEX = statusOrder.indexOf("in_transit");
  const effectiveIndex =
    orderStatus === "shipped" && shipment?.status === "in_transit" && TRANSIT_INDEX > currentStatusIndex
      ? TRANSIT_INDEX
      : currentStatusIndex;

  const timelineSteps = statusOrder.map((status, index) => {
    const isCompleted = effectiveIndex === -1 ? false : index < effectiveIndex;
    const isCurrent = index === effectiveIndex && !isCancelled;
    const isFuture =
      effectiveIndex === -1 || index > effectiveIndex || (isCancelled && index >= effectiveIndex);

    let event: CustomerShipmentEvent | null = null;
    if (shipment?.events) {
      event = shipment.events.find((e) => e.toStatus === status) || null;
    }

    return {
      status,
      label: formatStatusLabel(status),
      icon: statusIcons[status],
      isCompleted,
      isCurrent,
      isFuture,
      timestamp: event?.createdAt || (index === 0 ? orderCreatedAt : undefined),
    };
  });

  // Shipment events the order timeline doesn't model (e.g. delivery_failed)
  // are appended so no backend tracking event is ever hidden.
  const extraEvents = (shipment?.events || []).filter((e) => !statusOrder.includes(e.toStatus));

  return (
    <div className="space-y-6">
      {/* Order Status Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

        <div className="space-y-6 pl-14">
          {timelineSteps.map((step, index) => {
            const isLast = index === timelineSteps.length - 1 && extraEvents.length === 0;

            return (
              <div key={step.status} className="relative">
                {/* Status dot */}
                <div
                  className={cn(
                    "absolute -left-14 top-1 h-10 w-10 flex items-center justify-center rounded-full border-2 border-border bg-background z-10 transition-all duration-300",
                    step.isCompleted && "bg-success border-success text-success-foreground",
                    step.isCurrent && "bg-primary border-primary text-primary-foreground animate-pulse-ring",
                    step.isFuture && "bg-background border-border text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {step.isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Status content */}
                <div className={cn("min-h-[60px] pb-4", isLast && "pb-0")}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            "font-semibold text-sm",
                            step.isCompleted && "text-success",
                            step.isCurrent && "text-primary",
                            step.isFuture && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </h4>
                        {step.isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-label">
                            Current
                          </span>
                        )}
                      </div>

                      {step.timestamp && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(step.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {extraEvents.map((event, index) => (
            <div key={`${event.toStatus}-${event.createdAt}-${index}`} className="relative">
              <div
                className="absolute -left-14 top-1 h-10 w-10 flex items-center justify-center rounded-full border-2 bg-destructive/10 border-destructive/30 text-destructive z-10"
                aria-hidden="true"
              >
                {statusIcons[event.toStatus] || <MapPin className="h-4 w-4" />}
              </div>
              <div className="min-h-[60px] pb-4">
                <h4 className="font-semibold text-sm text-destructive">
                  {formatStatusLabel(event.toStatus)}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipment Details */}
      {shipment && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            Shipment Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {shipment.trackingNumber && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Tracking #</p>
                <p className="font-mono text-sm font-medium">{shipment.trackingNumber}</p>
              </div>
            )}

            {shipment.courierName && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Courier</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-accent" />
                  </div>
                  <p className="font-medium">{shipment.courierName}</p>
                </div>
              </div>
            )}

            {shipment.shippedAt && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Shipped</p>
                <p className="text-sm">{formatDate(shipment.shippedAt)}</p>
              </div>
            )}

            {shipment.deliveredAt && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Delivered</p>
                <p className="text-sm text-success">{formatDate(shipment.deliveredAt)}</p>
              </div>
            )}

            {shipment.failedAt && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Delivery failed</p>
                <p className="text-sm text-destructive">{formatDate(shipment.failedAt)}</p>
              </div>
            )}

            {shipment.returnedAt && (
              <div>
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Returned</p>
                <p className="text-sm text-destructive">{formatDate(shipment.returnedAt)}</p>
              </div>
            )}

            {shipment.failureReason && (
              <div className="sm:col-span-2">
                <p className="text-xs font-label uppercase tracking-[0.15em] text-muted-foreground">Reason</p>
                <p className="text-sm capitalize">{shipment.failureReason.replace(/_/g, " ")}</p>
              </div>
            )}
          </div>

          {/* Tracking Events from Shipment */}
          {shipment.events.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Tracking History</h4>
              <div className="space-y-3">
                {shipment.events
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={`${event.toStatus}-${event.createdAt}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm",
                          event.toStatus === "delivered" && "bg-success/10 text-success",
                          (event.toStatus === "shipped" || event.toStatus === "in_transit") &&
                            "bg-primary/10 text-primary",
                          (event.toStatus === "delivery_failed" ||
                            event.toStatus === "returned_to_seller") &&
                            "bg-destructive/10 text-destructive",
                          "bg-muted text-muted-foreground"
                        )}
                      >
                        {statusIcons[event.toStatus] || <Circle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {formatStatusLabel(event.toStatus)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No shipment yet */}
      {!shipment && orderStatus !== "pending" && orderStatus !== "confirmed" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Shipment Not Created Yet</h3>
          <p className="text-muted-foreground text-sm">
            Your order is being prepared. Shipment tracking will appear here once the order is shipped.
          </p>
        </div>
      )}
    </div>
  );
}
