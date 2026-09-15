// Shared rules for creating and updating discount codes

const TYPES = new Set(['percentage', 'fixed_amount']);

export const isValidCouponCode = (code) => /^[A-Za-z0-9_-]{3,32}$/.test(code);

// Validates an admin's discount form. Returns { coupon } ready to save, or { error } to show.
export function parseCouponInput(body) {
  const code = String(body?.code || '').trim();
  if (!isValidCouponCode(code)) return { error: 'Codes must be 3–32 letters, numbers, dashes or underscores.' };
  if (!TYPES.has(body.discount_type)) return { error: 'Choose a percentage or fixed amount discount.' };

  const value = Number(body.discount_value);
  if (!Number.isFinite(value) || value <= 0) return { error: 'Enter a discount value greater than 0.' };
  if (body.discount_type === 'percentage' && value > 100) return { error: "A percentage discount can't be more than 100%." };

  let minimum = null;
  if (body.minimum_purchase_amount !== null && body.minimum_purchase_amount !== undefined && body.minimum_purchase_amount !== '') {
    minimum = Number(body.minimum_purchase_amount);
    if (!Number.isFinite(minimum) || minimum <= 0) return { error: 'Enter a minimum subtotal greater than 0.' };
  }

  let usageLimit = null;
  if (body.usage_limit !== null && body.usage_limit !== undefined && body.usage_limit !== '') {
    usageLimit = Number(body.usage_limit);
    if (!Number.isInteger(usageLimit) || usageLimit < 1) return { error: 'The usage limit must be a whole number of 1 or more.' };
  }

  let expiration = null;
  if (body.expiration_date) {
    const date = new Date(body.expiration_date);
    if (Number.isNaN(date.getTime())) return { error: 'Choose a valid end date.' };
    expiration = date.toISOString();
  }

  return {
    coupon: {
      code,
      discount_type: body.discount_type,
      discount_value: value,
      minimum_purchase_amount: minimum,
      usage_limit: usageLimit,
      expiration_date: expiration,
      is_active: body.is_active !== false,
    },
  };
}

// Checkout matches codes without regard to capitals, so uniqueness has to ignore them too
export async function couponCodeTaken(db, code, excludeId = null) {
  const { rows } = await db.query(
    'SELECT 1 FROM coupons WHERE UPPER(code) = UPPER($1) AND ($2::int IS NULL OR id <> $2::int) LIMIT 1',
    [code, excludeId]
  );
  return rows.length > 0;
}

// Orders move between tables as they're fulfilled or cancelled, so usage is counted across all three
export const COUPON_USAGE_COLUMNS = `
  COALESCE(coupon_use.order_count, 0) AS order_count,
  COALESCE(coupon_use.cancelled_count, 0) AS cancelled_count,
  COALESCE(coupon_use.discount_total, 0) AS discount_total,
  COALESCE(coupon_use.sales_total, 0) AS sales_total`;

export const COUPON_USAGE_JOIN = `
  LEFT JOIN (
    SELECT applied_coupon_id,
           COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS order_count,
           COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
           SUM(discount_amount) FILTER (WHERE status <> 'cancelled') AS discount_total,
           SUM(total_amount) FILTER (WHERE status <> 'cancelled') AS sales_total
    FROM (
      SELECT applied_coupon_id, discount_amount, total_amount, LOWER(order_status) AS status FROM orders WHERE applied_coupon_id IS NOT NULL
      UNION ALL SELECT applied_coupon_id, discount_amount, total_amount, 'delivered' FROM delivered_orders WHERE applied_coupon_id IS NOT NULL
      UNION ALL SELECT applied_coupon_id, discount_amount, total_amount, 'cancelled' FROM cancelled_orders WHERE applied_coupon_id IS NOT NULL
    ) used
    GROUP BY applied_coupon_id
  ) coupon_use ON coupon_use.applied_coupon_id = c.id`;

export const normalizeCoupon = (row) => ({
  ...row,
  discount_value: Number(row.discount_value),
  minimum_purchase_amount: row.minimum_purchase_amount === null ? null : Number(row.minimum_purchase_amount),
  usage_count: Number(row.usage_count) || 0,
  discount_total: Number(row.discount_total) || 0,
  sales_total: Number(row.sales_total) || 0,
});
