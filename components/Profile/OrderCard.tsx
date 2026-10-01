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
}

interface OrderCardProps {
  order: Order;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-neutral-100 text-neutral-600",
};

export default function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const placedDate = new Date(order.placed_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusStyle = STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600";

  const handleDownloadReceipt = () => {
    // TODO: wire to a real receipt-generation endpoint
    toast("Receipt download coming soon", { icon: "🧾" });
  };

  const handleCancelOrder = () => {
    // TODO: wire to a real order-cancellation endpoint
    toast("Cancel order coming soon", { icon: "⚠️" });
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white">
      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02]"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">Order #{order.order_number}</span>
          <span className="text-sm font-semibold text-black">{placedDate}</span>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle}`}
          >
            {order.status}
          </span>
          <span className="text-sm font-bold text-black">
            ₹{order.total_amount.toLocaleString("en-IN")}
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="border-t border-black/10 px-5 py-5">
          {/* Items — table on larger screens, stacked cards on mobile */}
          <div className="mb-6">
            {/* Desktop/tablet table */}
            <div className="hidden overflow-x-auto sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.order_item_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {item.prod_image ? (
                              <Image
                                src={item.prod_image}
                                alt={item.prod_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : null}
                          </div>
                          <span className="text-sm font-medium text-black">
                            {item.prod_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {item.prod_size ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-neutral-600">
                        ₹{item.unit_price.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-sm text-neutral-600">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-black">
                        ₹{item.line_total.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile stacked cards */}
            <div className="flex flex-col gap-4 sm:hidden">
              {order.order_items.map((item) => (
                <div
                  key={item.order_item_id}
                  className="flex gap-3 rounded-xl border border-black/10 p-3"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.prod_image ? (
                      <Image
                        src={item.prod_image}
                        alt={item.prod_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-black">
                      {item.prod_name}
                    </span>
                    {item.prod_size && (
                      <span className="text-xs text-neutral-500">
                        Size: {item.prod_size}
                      </span>
                    )}

                    <div className="mt-1 flex flex-col gap-0.5 text-xs text-neutral-500">
                      <div className="flex justify-between">
                        <span>Unit Price</span>
                        <span className="text-neutral-700">
                          ₹{item.unit_price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qty</span>
                        <span className="text-neutral-700">{item.quantity}</span>
                      </div>
                      <div className="flex justify-between border-t border-black/5 pt-1 font-semibold text-black">
                        <span>Total</span>
                        <span>₹{item.line_total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown + shipping address */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
                Price Details
              </h4>
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span>
                  {order.delivery_charge === 0
                    ? "Free"
                    : `₹${order.delivery_charge.toLocaleString("en-IN")}`}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                  <span>-₹{order.discount_amount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-black/10 pt-2 text-sm font-bold text-black">
                <span>Total</span>
                <span>₹{order.total_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
                Shipping Address
              </h4>
              <p className="font-medium text-black">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold capitalize text-neutral-500">
                  {order.shipping_address.address_type}
                </span>
              </p>
              <p className="text-neutral-600">{order.shipping_address.address_line1}</p>
              {order.shipping_address.landmark && (
                <p className="text-neutral-600">{order.shipping_address.landmark}</p>
              )}
              <p className="text-neutral-600">
                {order.shipping_address.city}, {order.shipping_address.state} -{" "}
                {order.shipping_address.pincode}
              </p>
              <p className="text-neutral-600">{order.shipping_address.country}</p>
              <p className="mt-1 text-neutral-500">
                {order.shipping_address.phone_dial_code} {order.shipping_address.phone_number}
              </p>
              <p className="text-neutral-500">{order.shipping_address.email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-black/10 pt-5">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-black/5"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
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