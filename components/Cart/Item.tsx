"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";
import { useCart } from "@/components/Cart/CartProvider";

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

export default function Item({ item }: { item: CartItemData }) {
  const { updateQuantity, removeItem } = useCart();
  const { quantity, products, product_variants } = item;

  const image = products.prod_images?.[0] ?? "/placeholder.png";
  const price = Number(product_variants.prod_price);

  const handleIncrease = () => {
    playMechanicalClick();
    updateQuantity(item.cart_id, Math.min(quantity + 1, 99));
  };

  const handleDecrease = () => {
    playMechanicalClick();
    updateQuantity(item.cart_id, Math.max(quantity - 1, 1));
  };

  const handleRemove = () => {
    playMechanicalClick();
    playStampSound();
    removeItem(item.cart_id);
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
            aria-label="Remove item"
            className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center border-2 border-transparent text-destructive transition-colors hover:border-border hover:bg-destructive/10"
          >
            <Trash2 size={16} strokeWidth={2.5} />
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
              disabled={quantity <= 1}
              className="flex h-7 w-7 cursor-pointer items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="flex h-7 w-7 items-center justify-center border-x-2 border-border font-mono text-xs font-black text-foreground">
              {quantity}
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