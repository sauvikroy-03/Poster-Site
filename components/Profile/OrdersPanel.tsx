"use client";

import React, { useEffect, useState } from "react";
import { PackageOpen, Loader2 } from "lucide-react";
import OrderCard, { Order } from "@/components/Profile/OrderCard";

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/myorders");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load orders.");
          return;
        }

        setOrders(data.orders);
      } catch {
        setError("Something went wrong while loading your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-black/10 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-72 w-full  flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-red-200 bg-white text-center">
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-white text-center">
        <PackageOpen className="h-8 w-8 text-neutral-300" />
        <p className="text-sm font-bold uppercase tracking-wide text-neutral-400">
          No orders yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {orders.map((order) => (
        <OrderCard key={order.order_id} order={order} />
      ))}
    </div>
  );
}