"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

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

export default function Item({ item }: ItemProps) {
  const { quantity, products, product_variants } = item;
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const image = products.prod_images?.[0] ?? "/placeholder.png";
  const price = Number(product_variants.prod_price);

  const handleIncrease = () => {
    setLocalQuantity((prev) => Math.min(prev + 1, 99));
  };

  const handleDecrease = () => {
    setLocalQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleRemove = () => {
    console.log("Remove item:", item.cart_id);
  };

  return (
    <div className="flex w-full items-start gap-4 border-b border-neutral-200 py-5 last:border-b-0">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:h-24 sm:w-24">
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
            aria-label="Remove item"
            className="flex-shrink-0 text-red-500 transition-colors hover:text-red-600"
          >
            <Trash2 size={18} />
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
              className="text-black transition-opacity disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            <span className="w-4 text-center text-sm font-bold">{localQuantity}</span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-label="Increase quantity"
              className="text-black"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}