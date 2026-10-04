export const DELIVERY_CHARGE = 79;

export type CouponInfo = {
  coupon_id: string;
  coupon_code: string;
  description: string | null;
  discount_type: string; // "percentage" | "fixed" (adjust if your enum differs)
  discount_amount: number;
  max_discount_amount: number | null;
  minimum_order_value: number;
  maximum_order_value: number | null;
};

export function checkCouponForSubtotal(
  c: CouponInfo,
  subtotal: number
): { valid: boolean; reason?: string; discount: number } {
  if (subtotal < c.minimum_order_value) {
    return {
      valid: false,
      reason: `Add ₹${(c.minimum_order_value - subtotal).toLocaleString("en-IN")} more to use ${c.coupon_code}.`,
      discount: 0,
    };
  }
  if (c.maximum_order_value !== null && subtotal > c.maximum_order_value) {
    return {
      valid: false,
      reason: `${c.coupon_code} is only valid on orders up to ₹${c.maximum_order_value.toLocaleString("en-IN")}.`,
      discount: 0,
    };
  }

  let discount =
    c.discount_type.toLowerCase().startsWith("percent")
      ? Math.floor((subtotal * c.discount_amount) / 100)
      : c.discount_amount;

  if (c.max_discount_amount !== null) discount = Math.min(discount, c.max_discount_amount);
  discount = Math.max(0, Math.min(discount, subtotal)); // never more than the subtotal

  return { valid: true, discount };
}