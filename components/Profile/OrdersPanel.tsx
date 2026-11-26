"use client";

import React, { useEffect, useState } from "react";
import { PackageOpen, Loader2 } from "lucide-react";
import OrderCard, { Order } from "@/components/Profile/OrderCard";

export default function OrdersPanel({ isActive = true }: { isActive?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const res = await fetch("/api/myorders", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load orders.");
          return;
        }

        setError("");
        setOrders(data.orders);
      } catch {
        if (!cancelled) {
          setError("Something went wrong while loading your orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [isActive]);

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-destructive bg-card p-6 text-center shadow-[4px_4px_0_0_var(--destructive)]">
        <p className="font-mono text-xs font-black uppercase tracking-wider text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-card text-center shadow-[4px_4px_0_0_var(--border)]">
        <span className="flex h-12 w-12 items-center justify-center border-2 border-border bg-muted">
          <PackageOpen className="h-6 w-6 text-muted-foreground" />
        </span>
        <p className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
          NO ORDERS FOUND // ARCHIVE EMPTY
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {orders.map((order) => (
        <OrderCard key={order.order_id} order={order} />
      ))}
    </div>
  );
}