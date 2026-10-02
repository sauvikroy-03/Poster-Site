"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";

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
        toast.add({
          type: "error",
          description: data.message || "Failed to update quantity.",
        });
        // Roll back to the last known-good value on failure
        setLocalQuantity(lastSyncedQuantity.current);
        return;
      }

      lastSyncedQuantity.current = newQuantity;
      router.refresh(); // keeps Order Summary totals in sync
    } catch {
      toast.add({
        type: "error",
        description: "Something went wrong. Please try again.",
      });
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
    playMechanicalClick();
    setLocalQuantity((prev) => Math.min(prev + 1, 99));
  };

  const handleDecrease = () => {
    playMechanicalClick();
    setLocalQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    playMechanicalClick();
    setIsRemoving(true);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: item.cart_id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.add({
          type: "error",
          description: data.message || "Failed to remove item.",
        });
        setIsRemoving(false);
        return;
      }

      playStampSound();
      toast.add({
        type: "success",
        description: "Item removed from cart",
      });
      router.refresh();
    } catch {
      toast.add({
        type: "error",
        description: "Something went wrong. Please try again.",
      });
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex w-full items-start gap-4 border-b-2 border-border py-5 text-foreground last:border-b-0">
      {/* Image Frame */}
      <div className="relative h-20 w-20 flex-shrink-0 border-2 border-border bg-muted sm:h-24 sm:w-24">
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
          <h3 className="truncate font-mono text-sm font-black uppercase tracking-tight text-foreground sm:text-base">
            {products.prod_name}
          </h3>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label="Remove item"
            className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center border-2 border-transparent text-destructive transition-colors hover:border-border hover:bg-destructive/10 disabled:opacity-40"
          >
            {isRemoving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          SIZE: <span className="font-bold text-foreground">{product_variants.prod_size}</span>
        </p>

        <div className="mt-1 flex items-end justify-between gap-3">
          <span className="font-mono text-base font-black text-foreground sm:text-lg">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {/* Quantity Stepper */}
          <div className="flex flex-shrink-0 items-center border-2 border-border bg-card">
            <button
              type="button"
              onClick={handleDecrease}
              aria-label="Decrease quantity"
              disabled={localQuantity <= 1}
              className="flex h-7 w-7 cursor-pointer items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="flex h-7 w-7 items-center justify-center border-x-2 border-border font-mono text-xs font-black text-foreground">
              {localQuantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-label="Increase quantity"
              className="flex h-7 w-7 cursor-pointer items-center justify-center transition-colors hover:bg-muted"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
