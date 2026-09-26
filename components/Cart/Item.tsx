"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export interface CartItemData {
  cart_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: {
    prod_id: string;
    prod_name: string;
    prod_slug: string;
    prod_category: string;
    prod_images: string[];
  };
  product_variants: {
    variant_id: string;
    prod_size: string;
    prod_material: string;
    prod_price: string;
    compare_at_price: string;
    sku: string;
    is_in_stock: string;
  };
}

interface ItemProps {
  item: CartItemData;
}

const DEBOUNCE_MS = 600;

export default function Item({ item }: ItemProps) {
  const { quantity, products, product_variants } = item;
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  // Tracks whether the pending debounced update has been confirmed by
  // the server yet — used to avoid firing a request for the very first
  // render (mount) where localQuantity trivially equals the prop.
  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedQuantity = useRef(quantity);

  const image = products.prod_images?.[0] ?? "/placeholder.png";
  const price = Number(product_variants.prod_price);

  const syncQuantity = async (newQuantity: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: item.cart_id, quantity: newQuantity }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update quantity.");
        // Roll back to the last known-good value on failure
        setLocalQuantity(lastSyncedQuantity.current);
        return;
      }

      lastSyncedQuantity.current = newQuantity;
      router.refresh(); // keeps Order Summary totals in sync
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLocalQuantity(lastSyncedQuantity.current);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (localQuantity !== lastSyncedQuantity.current) {
        syncQuantity(localQuantity);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuantity]);

  const handleIncrease = () => {
    setLocalQuantity((prev) => Math.min(prev + 1, 99));
  };

  const handleDecrease = () => {
    setLocalQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: item.cart_id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to remove item.");
        setIsRemoving(false);
        return;
      }

      toast.success("Item removed from cart");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex w-full items-start gap-4 border-b border-neutral-200 py-5 last:border-b-0">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-24 sm:w-24">
        <Image
          src={image}
          alt={products.prod_name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-black sm:text-base">
            {products.prod_name}
          </h3>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label="Remove item"
            className="flex-shrink-0 text-red-500 transition-colors hover:text-red-600 disabled:opacity-40 hover:scale-105 cursor-pointer"
          >
            {isRemoving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          Size: {product_variants.prod_size}
        </p>

        <div className="mt-1 flex items-end justify-between gap-3">
          <span className="text-base font-bold text-black sm:text-lg">
            ₹{price.toLocaleString("en-IN")}
          </span>

          <div className="flex flex-shrink-0 items-center gap-3 rounded-full bg-neutral-100 px-3 py-1.5">
            <button
              type="button"
              onClick={handleDecrease}
              aria-label="Decrease quantity"
              disabled={localQuantity <= 1}
              className="text-black transition-opacity disabled:opacity-30 hover:cursor-pointer "
            >
              <Minus size={14}  />
            </button>
            <span className="w-4 text-center text-sm font-bold">{localQuantity}</span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-label="Increase quantity"
              className="text-black hover:cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}