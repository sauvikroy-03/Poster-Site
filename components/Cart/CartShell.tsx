"use client";

import { useState } from "react";
import { Tag, X ,Loader2} from "lucide-react";
import Item from "@/components/Cart/Item";
import DefaultAddress from "@/components/Cart/DefaultAddress";
import CheckoutButton from "@/components/Cart/CheckoutButton";
import { useCart } from "@/components/Cart/CartProvider";
import { toast } from "@/components/ui/toast";
import { DELIVERY_CHARGE } from "@/lib/coupons-shared";

export default function CartShell() {
  const { items, subtotal, discount, total, coupon, couponWarning, applyCoupon, removeCoupon } =
    useCart();
  const [promoCode, setPromoCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (isApplying || !promoCode.trim()) return;
    setIsApplying(true);
    const result = await applyCoupon(promoCode);
    setIsApplying(false);

    if (result.ok) {
      setPromoCode("");
      toast.add({ type: "success", description: result.message });
    } else {
      toast.add({ type: "error", description: result.message });
    }
  };

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
          {coupon ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-2 border-border bg-muted/40 px-3 py-2.5 font-mono text-xs">
                <span className="flex items-center gap-2 font-black uppercase tracking-wider text-foreground">
                  <Tag size={14} />
                  {coupon.coupon_code}
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  aria-label="Remove coupon"
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
              {couponWarning && (
                <p className="font-mono text-xs text-destructive">{couponWarning}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="PROMO CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  className="w-full border-2 border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="flex-shrink-0 border-2 border-border bg-secondary px-5 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-secondary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                  {isApplying ? (
 <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    "Apply"
  )}
              </button>
            </div>
          )}

          <CheckoutButton />
        </div>
      </div>
    </div>
  );
}