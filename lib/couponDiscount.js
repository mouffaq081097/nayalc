// How much a discount code takes off an order. Shared by the cart and the order API,
// so the total the customer sees is exactly the total the server charges.

// Product ids a code is limited to, or null when it applies to the entire order
export function couponProductIds(coupon) {
  const ids = Array.isArray(coupon?.product_ids) ? coupon.product_ids.map(Number).filter(Number.isInteger) : [];
  return ids.length > 0 ? ids : null;
}

// items: [{ productId, price, quantity }]. Returns the discount in AED, rounded to fils.
export function calcCouponDiscount(coupon, items) {
  if (!coupon) return 0;
  const lineTotal = (item) => Number(item.price) * Number(item.quantity);
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  if (coupon.minimum_purchase_amount != null && subtotal < Number(coupon.minimum_purchase_amount)) return 0;

  // A product-specific code only discounts those products' lines
  const productIds = couponProductIds(coupon);
  const base = productIds
    ? items.filter(item => productIds.includes(Number(item.productId))).reduce((sum, item) => sum + lineTotal(item), 0)
    : subtotal;
  if (base <= 0) return 0;

  const value = Number(coupon.discount_value);
  const discount = coupon.discount_type === 'percentage' ? base * value / 100 : value;
  return Math.round(Math.min(discount, base) * 100) / 100;
}
