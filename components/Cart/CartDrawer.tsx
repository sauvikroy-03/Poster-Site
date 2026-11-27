"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Maximize2, ShoppingBag, X } from "lucide-react";
import Item, { type CartItemData } from "@/components/Cart/Item";
import DefaultAddress from "@/components/Cart/DefaultAddress";
import CheckoutButton from "@/components/Cart/CheckoutButton";
import CouponSection from "@/components/Cart/CouponSection";
import { CartProvider, useCart } from "@/components/Cart/CartProvider";
import { DELIVERY_CHARGE } from "@/lib/coupons-shared";
import { playMechanicalClick } from "@/lib/sounds";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemData[];
  isLoading: boolean;
  sessionKey: number;
}

function CartDrawerContent({ onClose }: { onClose: () => void }) {
  const { items, itemCount, subtotal, discount, total, coupon } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex w-full flex-col items-center gap-4 border-2 border-dashed border-border bg-card p-8 shadow-[4px_4px_0_0_var(--border)]">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-border bg-accent text-foreground">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <p className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
            YOUR CART IS EMPTY // NO ITEMS REGISTERED
          </p>
          <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
            <Link
              href="/categories"
              onClick={onClose}
              className={`${FOCUS} flex flex-1 items-center justify-center border-2 border-border bg-primary px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform hover:-translate-y-0.5`}
            >
              Browse Posters
            </Link>
            <Link
              href="/customize"
              onClick={onClose}
              className={`${FOCUS} flex flex-1 items-center justify-center border-2 border-border bg-accent px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform hover:-translate-y-0.5`}
            >
              Custom Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Items */}
        <div className="flex flex-col border-2 border-border bg-card px-4 shadow-[4px_4px_0_0_var(--border)]">
          {items.map((item) => (
            <Item key={item.cart_id} item={item} />
          ))}
        </div>

        {/* Delivery Address */}
        <div className="flex flex-col gap-3 border-2 border-border bg-card p-4 shadow-[4px_4px_0_0_var(--border)]">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            Deliver To
          </h3>
          <DefaultAddress />
        </div>

        {/* Price Details & Promo Code */}
        <div className="flex flex-col gap-4 border-2 border-border bg-card p-4 shadow-[4px_4px_0_0_var(--border)]">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            Price Details ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h3>

          <div className="flex flex-col gap-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="uppercase">Subtotal</span>
              <span className="font-bold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
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
              <span className="font-bold text-foreground">
                {DELIVERY_CHARGE === 0 ? "FREE" : `₹${DELIVERY_CHARGE}`}
              </span>
            </div>
          </div>

          <CouponSection compact />
        </div>
      </div>

      {/* Sticky Footer with Total + Buy Now */}
      <div className="border-t-2 border-border bg-card px-5 py-4">
        <div className="mb-3 flex items-center justify-between font-mono">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Total Payable
          </span>
          <span className="text-xl font-black text-foreground">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
        <CheckoutButton label="BUY NOW" onSuccess={onClose} />
      </div>
    </>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  isLoading,
  sessionKey,
}: CartDrawerProps) {
  const router = useRouter();
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Lock page scroll while open on desktop
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Let nested address dialogs handle Escape first
      if (document.querySelector('[data-slot="dialog-content"]')) return;
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleExpand = () => {
    playMechanicalClick();
    onClose();
    router.push("/cart");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 hidden md:block">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Slide-in Panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l-2 border-border bg-background text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-border bg-card px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h2 className="font-mono text-lg font-black uppercase tracking-tight text-foreground">
                  Your Cart
                </h2>
                {totalCount > 0 && (
                  <span className="border-2 border-border bg-accent px-2 py-0.5 font-mono text-xs font-black text-foreground">
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpand}
                  aria-label="Expand to cart page"
                  title="Open full cart page"
                  className={`${FOCUS} flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-border bg-card text-foreground shadow-[2px_2px_0_0_var(--border)] transition-colors hover:bg-accent active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
                >
                  <Maximize2 className="h-4 w-4" strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    onClose();
                  }}
                  aria-label="Close cart"
                  title="Close cart"
                  className={`${FOCUS} flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-border bg-card text-foreground shadow-[2px_2px_0_0_var(--border)] transition-colors hover:bg-destructive hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CartProvider key={sessionKey} initialItems={items}>
                <CartDrawerContent onClose={onClose} />
              </CartProvider>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
