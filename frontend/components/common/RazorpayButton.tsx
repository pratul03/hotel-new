"use client";

import Script from "next/script";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayButtonProps {
  orderId: string;
  /** Amount in paise (₹1 = 100 paise) */
  amount: number;
  currency?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onError?: (error: Error) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function RazorpayButton({
  orderId,
  amount,
  currency = "INR",
  description = "Room Booking",
  prefill,
  onSuccess,
  onError,
  label = "Pay Now",
  disabled = false,
  className,
}: RazorpayButtonProps) {
  const [scriptReady, setScriptReady] = useState(false);

  const openCheckout = () => {
    if (!window.Razorpay) return;

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount,
      currency,
      description,
      order_id: orderId,
      prefill,
      handler: (response: RazorpaySuccessResponse) => onSuccess(response),
      modal: {
        ondismiss: () => onError?.(new Error("Payment cancelled by user")),
      },
    });
    rzp.open();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
      />
      <Button
        onClick={openCheckout}
        disabled={disabled || !scriptReady}
        className={cn("w-full", className)}
        size="lg"
      >
        {!scriptReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>
    </>
  );
}
