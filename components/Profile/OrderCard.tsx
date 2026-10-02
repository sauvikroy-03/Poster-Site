"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Download, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import OrderTracker, { type StatusHistoryRow } from "@/components/Profile/OrderTracker";

interface OrderItem {
  order_item_id: string;
  product_id: string | null;
  variant_id: string | null;
  prod_name: string;
  prod_image: string | null;
  prod_size: string | null;
  prod_material: string | null;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone_country_iso2: string;
  phone_dial_code: string;
  phone_number: string;
  address_line1: string;
  landmark: string | null;
  pincode: string;
  city: string;
  state: string;
  country: string;
  address_type: "home" | "office";
}

export interface Order {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_charge: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  discount_details: Record<string, unknown> | null;
  placed_at: string;
  order_items: OrderItem[];
  order_status_history?: StatusHistoryRow[];
}

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const placedDate = new Date(order.placed_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

  const handleDownloadReceipt = () => {
    toast("Receipt download coming soon", { icon: "🧾" });
  };

  const handleCancelOrder = () => {
    toast("Cancel order coming soon", { icon: "⚠️" });
  };

  return (
    <div className="w-full border-2 border-border bg-card text-card-foreground shadow-[4px_4px_0_0_var(--border)]">
      {/* Summary row — always visible */}
      <div className="flex w-full items-center justify-between gap-4 border-b-2 border-border px-5 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            ORDER // #{order.order_number}
          </span>
          <span className="text-sm font-extrabold uppercase tracking-tight text-foreground">
            {placedDate}
          </span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="flex cursor-pointer items-center gap-1.5 border-2 border-border bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            {isExpanded ? "Hide Details" : "View Details"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="flex flex-col items-end">
            <span className="font-mono text-base font-black tracking-tight text-foreground">
              ₹{order.total_amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* Order tracking — always visible */}
      <div className="bg-card px-5 pb-5 pt-4">
        <OrderTracker
          status={order.status}
          history={order.order_status_history ?? []}
        />
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="border-t-2 border-border bg-muted/20 px-5 py-5">
          {/* Items — table on desktop/tablet, stacked cards on mobile */}
          <div className="mb-6">
            {/* Desktop/tablet table */}
            <div className="hidden border-2 border-border bg-card sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Item
                    </TableHead>
                    <TableHead className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Size
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Qty
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs font-black uppercase tracking-wider text-foreground">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow
                      key={item.order_item_id}
                      className="border-b border-border/40 hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 border-2 border-border bg-muted">
                            {item.prod_image && (
                              <Image
                                src={item.prod_image}
                                alt={item.prod_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight text-foreground">
                            {item.prod_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                        {item.prod_size ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                        ₹{item.unit_price.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-black text-foreground">
                        ₹{item.line_total.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile stacked cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {order.order_items.map((item) => (
                <div
                  key={item.order_item_id}
                  className="flex gap-3 border-2 border-border bg-card p-3 shadow-[2px_2px_0_0_var(--border)]"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 border-2 border-border bg-muted">
                    {item.prod_image && (
                      <Image
                        src={item.prod_image}
                        alt={item.prod_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <span className="line-clamp-1 text-xs font-extrabold uppercase tracking-tight text-foreground">
                        {item.prod_name}
                      </span>
                      {item.prod_size && (
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                          SIZE: {item.prod_size}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1 border-t border-border/30 pt-1 text-[11px]">
                      <div className="flex justify-between font-mono text-muted-foreground">
                        <span>PRICE</span>
                        <span>₹{item.unit_price.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-mono text-muted-foreground">
                        <span>QTY</span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/30 pt-0.5 font-mono font-black text-foreground">
                        <span>TOTAL</span>
                        <span>₹{item.line_total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown + shipping address */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Price Details */}
            <div className="border-2 border-border bg-card p-4 shadow-[2px_2px_0_0_var(--border)]">
              <h4 className="mb-3 border-b-2 border-border pb-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                PRICE DETAILS
              </h4>
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">
                    ₹{order.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="font-bold text-foreground">
                    {order.delivery_charge === 0
                      ? "FREE"
                      : `₹${order.delivery_charge.toLocaleString("en-IN")}`}
                  </span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>
                      Discount{order.coupon_code ? ` [${order.coupon_code}]` : ""}
                    </span>
                    <span className="font-bold">
                      -₹{order.discount_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t-2 border-border pt-2 text-sm font-black text-foreground">
                  <span>TOTAL PAID</span>
                  <span>₹{order.total_amount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-2 border-border bg-card p-4 shadow-[2px_2px_0_0_var(--border)]">
              <h4 className="mb-3 border-b-2 border-border pb-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                SHIPPING DISPATCH
              </h4>
              <div className="text-xs">
                <p className="flex items-center gap-2 font-extrabold uppercase text-foreground">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                  <span className="border border-border bg-secondary px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase text-secondary-foreground">
                    {order.shipping_address.address_type}
                  </span>
                </p>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {order.shipping_address.address_line1}
                  {order.shipping_address.landmark && (
                    <>, {order.shipping_address.landmark}</>
                  )}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state} —{" "}
                  {order.shipping_address.pincode}
                  <br />
                  {order.shipping_address.country}
                </p>
                <div className="mt-2 border-t border-border/40 pt-2 font-mono text-[11px] text-muted-foreground">
                  <p>TEL: {order.shipping_address.phone_dial_code} {order.shipping_address.phone_number}</p>
                  <p className="truncate">EMAIL: {order.shipping_address.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-3 border-t-2 border-border pt-4">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-foreground shadow-[3px_3px_0_0_var(--border)] transition-transform hover:bg-muted active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex items-center gap-2 border-2 border-destructive bg-card px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-destructive shadow-[3px_3px_0_0_var(--destructive)] transition-transform hover:bg-destructive/10 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}