"use client";

import { Tag } from "lucide-react";
import Item from "@/components/Cart/Item";
import DefaultAddress from "@/components/Cart/DefaultAddress";
import CheckoutButton from "@/components/Cart/CheckoutButton";
import { useCart } from "@/components/Cart/CartProvider";

const DELIVERY_CHARGE = 79;

export default function CartShell() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border bg-card p-8 text-center shadow-[4px_4px_0_0_var(--border)]">
        <p className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
          YOUR CART IS EMPTY // NO ITEMS REGISTERED
        </p>
      </div>
    );
  }

  const deliveryCharge = DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      {/* Item list */}
      <div className="flex flex-col border-2 border-border bg-card px-5 shadow-[4px_4px_0_0_var(--border)] lg:col-span-2">
        {items.map((item) => (
          <Item key={item.cart_id} item={item} />
        ))}
      </div>

      {/* Right column: Address + Summary */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]">
          <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
            Deliver To
          </h2>
          <DefaultAddress />
        </div>

        <div className="flex flex-col gap-5 border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]">
          <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
            Order Summary
          </h2>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Subtotal</span>
              <span className="font-bold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Delivery Fee</span>
              <span className="font-bold text-foreground">₹{deliveryCharge}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 border-border pt-4 font-mono">
            <span className="text-sm font-black uppercase text-foreground">Total</span>
            <span className="text-xl font-black text-foreground">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Promo code */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="PROMO CODE"
                className="w-full border-2 border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex-shrink-0 border-2 border-border bg-secondary px-5 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-secondary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-muted"
            >
              Apply
            </button>
          </div>

          <CheckoutButton />
        </div>
      </div>
    </div>
  );
}