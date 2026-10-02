"use client";

import React, { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";
import { useCart } from "@/components/Cart/CartProvider";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { flush } = useCart();

  const handleCheckout = async () => {
    if (isProcessing) return;
    playMechanicalClick();
    setIsProcessing(true);

    try {
      // Make sure the server has the quantities the user is looking at
      const synced = await flush();
      if (!synced) {
        toast.add({
          type: "error",
          description: "Couldn't save your cart changes. Please check quantities and try again.",
        });
        setIsProcessing(false);
        return;
      }

      const createRes = await fetch("/api/checkout/create-order", { method: "POST" });
      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        toast.add({type:"error",description:createData.message || "Failed to start checkout."});
        setIsProcessing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.add({type:"error",description:"Failed to load payment gateway. Please try again."});
        setIsProcessing(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        order_id: createData.razorpayOrderId,
        name: "Your Store",
        description: `Order ${createData.orderNumber}`,
        prefill: createData.prefill,
        theme: { color: "#000000" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/checkout/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createData.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              toast.add({type:"error",description:verifyData.message || "Payment verification failed."});
              return;
            }

            playStampSound();
            toast.add({type:"success",description:"Order placed successfully!"});
            router.push(`/account?tab=orders`);
            router.refresh();
          } catch {
            toast.add({type:"error",description:"Something went wrong while verifying your payment."});
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      });

      razorpay.open();
    } catch {
      toast.add({type:"error",description:"Something went wrong. Please try again."});
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isProcessing}
      className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-border bg-primary py-4 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[4px_4px_0_0_var(--accent)] transition-all hover:bg-primary/95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          PROCESSING...
        </>
      ) : (
        <>
          PROCEED TO CHECKOUT
          <ChevronRight size={16} strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}