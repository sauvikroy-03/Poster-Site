"use client";

import React, { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

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

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const createRes = await fetch("/api/checkout/create-order", { method: "POST" });
      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        toast.error(createData.message || "Failed to start checkout.");
        setIsProcessing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
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
              toast.error(verifyData.message || "Payment verification failed.");
              return;
            }

            toast.success("Order placed successfully!");
            router.push(`/orders/${createData.orderId}`);
            router.refresh();
          } catch {
            toast.error("Something went wrong while verifying your payment.");
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
      toast.error("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isProcessing}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 duration-300 ease-out hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Go to Checkout
          <ChevronRight size={16} />
        </>
      )}
    </button>
  );
}