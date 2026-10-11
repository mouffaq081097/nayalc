import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { calcCouponDiscount } from '@/lib/couponDiscount';
import { ensureCouponProductsColumn } from '@/lib/couponRules';
import { pointsToAed } from '@/lib/loyalty';
import { vatFromGross } from '@/lib/vat';

// POST { code } — apply a discount code to an open order and recalculate its totals.
// POST { code: null } removes the discount. For orders the customer paid with a code the
// order didn't record (e.g. one recovered by hand), so the order matches what they paid.
// The code's active / end date / usage limit aren't checked: the admin is correcting a past order.
export async function POST(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { orderId } = await params;
  const { code } = await request.json();

  await ensureCouponProductsColumn(db);
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: [order] } = await client.query(
      'SELECT id, applied_coupon_id, shipping_cost, gift_wrap_cost, redeemed_points FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (!order) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Only open orders can be changed. Delivered and cancelled orders can't." }, { status: 404 });
    }

    let coupon = null;
    if (code) {
      const { rows } = await client.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [String(code).trim()]);
      coupon = rows[0];
      if (!coupon) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: `There's no discount code "${code}".` }, { status: 400 });
      }
    }

    const { rows: items } = await client.query(
      'SELECT product_id AS "productId", price, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const subtotal = Math.round(items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0) * 100) / 100;
    const discount = coupon ? calcCouponDiscount(coupon, items) : 0;
    if (coupon && discount <= 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: `${coupon.code} doesn't take anything off this order (check its minimum subtotal or the products it applies to).` }, { status: 400 });
    }

    const total = Math.max(0, Math.round((subtotal + Number(order.shipping_cost || 0) + Number(order.gift_wrap_cost || 0)
      - discount - pointsToAed(order.redeemed_points)) * 100) / 100);
    const tax = vatFromGross(total);

    await client.query(
      `UPDATE orders SET applied_coupon_id = $1, discount_amount = $2, subtotal = $3, total_amount = $4, tax_amount = $5, updated_at = NOW()
       WHERE id = $6`,
      [coupon?.id ?? null, discount, subtotal, total, tax, orderId]
    );

    // Keep each code's usage count right when it's swapped on or off an order
    const previousId = order.applied_coupon_id;
    if (previousId !== (coupon?.id ?? null)) {
      if (previousId) await client.query('UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = $1', [previousId]);
      if (coupon) await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [coupon.id]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ couponCode: coupon?.code ?? null, discountAmount: discount, subtotal, totalAmount: total, taxAmount: tax });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error applying discount to order ${orderId}:`, error);
    return NextResponse.json({ message: 'The discount could not be applied.', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
