"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { CustomerOrder, CustomerOrderListData } from "@/types/order";
import { orderService } from "@/services/orderService";
import { OrderCard } from "./OrderCard";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderListViewProps {
  initialOrders?: CustomerOrderListData;
}

export function OrderListView({ initialOrders }: OrderListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlStatus = searchParams.get("status") || "all";

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>(
    Array.isArray(initialOrders?.orders) ? initialOrders.orders : []
  );
  const [pagination, setPagination] = useState({
    page: initialOrders?.pagination?.page || 1,
    limit: initialOrders?.pagination?.limit || 10,
    total: initialOrders?.pagination?.total || 0,
    totalPages: initialOrders?.pagination?.totalPages || 0,
  });
  // Only show skeletons when we have no data to show yet.
  const [loading, setLoading] = useState(!initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);
  const [searchQuery, setSearchQuery] = useState("");

  // Token only exists in the browser - read it after mount so the first
  // server render and the client render agree (no hydration mismatch).
  useEffect(() => {
    setToken(localStorage.getItem("customer_token"));
    setTokenChecked(true);
  }, []);

  // Keep local filter state in sync with the URL without fighting the fetch effect.
  useEffect(() => {
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  useEffect(() => {
    if (!tokenChecked || !token) return;
    // Skip the first fetch when the page already supplied data for this exact view.
    if (
      initialOrders &&
      urlPage === (initialOrders.pagination?.page || 1) &&
      urlStatus === "all"
    ) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // The backend list endpoint accepts only page/limit - status is filtered
    // client-side below.
    const listPage = Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1;
    orderService
      .getMyOrders(token, { page: listPage, limit: 10 })
      .then((data) => {
        if (cancelled) return;
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setPagination(
          data?.pagination || { page: listPage, limit: 10, total: 0, totalPages: 0 }
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load orders");
        if (err instanceof Error && err.message === "Authentication required") {
          router.push("/login?redirect=/account/orders");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenChecked, token, urlPage, urlStatus, router]);

  const fetchOrders = () => {
    // Manual retry - reload the current view's data directly.
    if (!token) return;
    setLoading(true);
    setError(null);
    const retryPage = Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1;
    orderService
      .getMyOrders(token, { page: retryPage, limit: 10 })
      .then((data) => {
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setPagination(
          data?.pagination || { page: retryPage, limit: 10, total: 0, totalPages: 0 }
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/account/orders?${params.toString()}`);
  };

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    params.set("page", "1");
    router.push(`/account/orders?${params.toString()}`);
  };

  const handleViewDetails = (orderNumber: string) => {
    router.push(`/account/orders/${orderNumber}`);
  };

  const handleTrackOrder = (orderNumber: string) => {
    router.push(`/track-order?order=${orderNumber}`);
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    if (statusFilter !== "all" && order.orderStatus !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some((item) =>
        item.productName.toLowerCase().includes(query)
      )
    );
  });

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "ready_to_ship", label: "Ready to Ship" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
  ];

  if (!tokenChecked) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your orders</h2>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          You need to be signed in to see your order history and track deliveries.
        </p>
        <Button asChild size="lg">
          <Link href="/login?redirect=/account/orders">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (loading && orders?.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="Unable to load orders"
        description={error}
        action={
          <Button onClick={fetchOrders}>
            Try Again
          </Button>
        }
      />
    );
  }

  if (filteredOrders?.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title={searchQuery ? "No matching orders" : "No orders yet"}
        description={searchQuery
          ? `No orders found matching "${searchQuery}"`
          : "Your order history will appear here once you place orders."}
        action={
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
            aria-label="Search orders"
          />
          <div className="w-full sm:w-[180px]">
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={statusOptions}
              aria-label="Filter orders by status"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredOrders?.length} of {pagination?.total} order{pagination?.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.orderNumber}
            order={order}
            onViewDetails={handleViewDetails}
            onTrackOrder={handleTrackOrder}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination?.page - 1)}
            disabled={pagination?.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination?.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination?.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination?.page <= 3) {
                pageNum = i + 1;
              } else if (pagination?.page >= pagination?.totalPages - 2) {
                pageNum = pagination?.totalPages - 4 + i;
              } else {
                pageNum = pagination?.page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination?.page ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="h-9 w-9 px-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination?.page + 1)}
            disabled={pagination?.page >= pagination?.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}