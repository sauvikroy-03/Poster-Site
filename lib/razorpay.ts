import crypto from "crypto";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

function getAuthHeader() {
  const key = process.env.Razorpay_API_KEY;
  const secret = process.env.Razorpay_API_Secret;

  if (!key || !secret) {
    throw new Error("Missing Razorpay API credentials.");
  }

  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string | null;
}

export async function createRazorpayOrder(params: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Razorpay Order Create Error:", data);
    throw new Error(data?.error?.description || "Failed to create Razorpay order.");
  }

  return data as RazorpayOrder;
}

// HMAC-SHA256 signature check per Razorpay's docs, using a constant-time
// comparison so response timing can't leak information about the secret.
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.Razorpay_API_Secret;
  if (!secret) throw new Error("Missing Razorpay API secret.");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(params.signature, "utf8");

  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

// The key id is not secret — Razorpay's own checkout widget requires it
// client-side — so it's fine to return this from an API response.
export function getRazorpayKeyId(): string {
  const key = process.env.Razorpay_API_KEY;
  if (!key) throw new Error("Missing Razorpay key id.");
  return key;
}