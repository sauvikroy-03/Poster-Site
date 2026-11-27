"use client";

import Item from "@/components/Cart/Item";
import DefaultAddress from "@/components/Cart/DefaultAddress";
import CheckoutButton from "@/components/Cart/CheckoutButton";
import CouponSection from "@/components/Cart/CouponSection";
import { useCart } from "@/components/Cart/CartProvider";
import { DELIVERY_CHARGE } from "@/lib/coupons-shared";

export default function CartShell() {
  const { items, subtotal, discount, total, coupon } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border bg-card p-8 text-center shadow-[4px_4px_0_0_var(--border)]">
        <p className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
          YOUR CART IS EMPTY // NO ITEMS REGISTERED
        </p>
      </div>
    );
  }

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
              <span className="font-bold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {discount > 0 && coupon && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="uppercase">Discount ({coupon.coupon_code})</span>
                <span className="font-bold text-foreground">
                  -₹{discount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Delivery Fee</span>
              <span className="font-bold text-foreground">₹{DELIVERY_CHARGE}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 border-border pt-4 font-mono">
            <span className="text-sm font-black uppercase text-foreground">Total</span>
            <span className="text-xl font-black text-foreground">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Promo code */}
          <CouponSection />

          <CheckoutButton />
        </div>
      </div>
    </div>
  );
}