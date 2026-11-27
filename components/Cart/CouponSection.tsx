"use client";

import { useMemo, useState } from "react";
import { Loader2, Tag, TicketPercent, X } from "lucide-react";
import { useCart } from "@/components/Cart/CartProvider";
import { toast } from "@/components/ui/toast";
import { checkCouponForSubtotal, type CouponInfo } from "@/lib/coupons-shared";

function formatOfferLabel(coupon: CouponInfo): string {
  if (coupon.discount_type.toLowerCase().startsWith("percent")) {
    const cap =
      coupon.max_discount_amount !== null
        ? ` up to ₹${coupon.max_discount_amount.toLocaleString("en-IN")}`
        : "";
    return `${coupon.discount_amount}% OFF${cap}`;
  }
  return `₹${coupon.discount_amount.toLocaleString("en-IN")} OFF`;
}

export default function CouponSection({ compact = false }: { compact?: boolean }) {
  const {
    subtotal,
    coupon,
    couponWarning,
    availableCoupons,
    couponsLoading,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  const evaluatedCoupons = useMemo(() => {
    return availableCoupons
      .map((item) => ({
        coupon: item,
        check: checkCouponForSubtotal(item, subtotal),
      }))
      .sort((a, b) => {
        if (a.check.valid !== b.check.valid) return a.check.valid ? -1 : 1;
        return b.check.discount - a.check.discount;
      });
  }, [availableCoupons, subtotal]);

  const handleApplyCode = async (rawCode: string, clearInput = false) => {
    const normalized = rawCode.trim().toUpperCase();
    if (applyingCode || !normalized) return;

    setApplyingCode(normalized);
    const result = await applyCoupon(normalized);
    setApplyingCode(null);

    if (result.ok) {
      if (clearInput) setPromoCode("");
      toast.add({ type: "success", description: result.message });
    } else {
      toast.add({ type: "error", description: result.message });
    }
  };

  if (coupon) {
    return (
      <div className={compact ? "flex flex-col gap-1.5 border-t-2 border-border pt-3" : "flex flex-col gap-2"}>
        <div
          className={`flex items-center justify-between border-2 border-border bg-muted/40 px-3 font-mono text-xs ${
            compact ? "py-2" : "py-2.5"
          }`}
        >
          <span className="flex items-center gap-2 font-black uppercase tracking-wider text-foreground">
            <Tag size={compact ? 13 : 14} />
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
          <p className={`font-mono text-destructive ${compact ? "text-[11px]" : "text-xs"}`}>
            {couponWarning}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-col gap-3 border-t-2 border-border pt-3" : "flex flex-col gap-3"}>
      {/* Eligible coupons listed above Apply Coupon */}
      {couponsLoading ? (
        <div className="flex items-center gap-2 border-2 border-dashed border-border bg-muted/20 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking available coupons...
        </div>
      ) : (
        evaluatedCoupons.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              <TicketPercent size={13} />
              <span>Available Coupons ({evaluatedCoupons.length})</span>
            </div>

            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-0.5">
              {evaluatedCoupons.map(({ coupon: item, check }) => {
                const isThisApplying = applyingCode === item.coupon_code;
                const offerLabel = formatOfferLabel(item);

                return (
                  <div
                    key={item.coupon_id}
                    className={`flex items-center justify-between gap-3 border-2 border-border bg-background px-3 py-2 font-mono ${
                      check.valid ? "" : "opacity-75"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="border border-dashed border-border bg-accent/25 px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-foreground">
                          {item.coupon_code}
                        </span>
                        <span className="text-[11px] font-black uppercase text-foreground">
                          {offerLabel}
                        </span>
                        {check.valid && check.discount > 0 && (
                          <span className="border border-border bg-accent px-1.5 py-0.5 text-[10px] font-black uppercase text-foreground">
                            Save ₹{check.discount.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      {!check.valid && check.reason ? (
                        <p className="mt-0.5 text-[10px] font-bold text-destructive">
                          {check.reason}
                        </p>
                      ) : (
                        item.minimum_order_value > 0 && (
                          <p className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                            Min order ₹{item.minimum_order_value.toLocaleString("en-IN")}
                          </p>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyCode(item.coupon_code)}
                      disabled={!check.valid || applyingCode !== null}
                      className="flex-shrink-0 cursor-pointer border-2 border-border bg-accent px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform hover:opacity-90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                    >
                      {isThisApplying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Manual promo code input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag
            size={compact ? 14 : 16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="PROMO CODE"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCode(promoCode, true)}
            className={`w-full border-2 border-border bg-background font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none ${
              compact ? "py-2 pl-8 pr-2.5" : "py-2.5 pl-9 pr-3"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => handleApplyCode(promoCode, true)}
          disabled={applyingCode !== null || !promoCode.trim()}
          className={`flex-shrink-0 cursor-pointer border-2 border-border bg-secondary font-mono text-xs font-black uppercase tracking-wider text-secondary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${
            compact ? "px-4 py-2" : "px-5 py-2.5"
          }`}
        >
          {applyingCode !== null && applyingCode === promoCode.trim().toUpperCase() ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </button>
      </div>
    </div>
  );
}
