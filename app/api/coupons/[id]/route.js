import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { COUPON_USAGE_COLUMNS, COUPON_USAGE_JOIN, couponCodeTaken, normalizeCoupon, parseCouponInput } from '@/lib/couponRules';

export async function GET(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const { rows } = await db.query(`
      SELECT c.*, ${COUPON_USAGE_COLUMNS}
      FROM coupons c
      ${COUPON_USAGE_JOIN}
      WHERE c.id = $1
    `, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json(normalizeCoupon(rows[0]));
  } catch (error) {
    console.error(`Error fetching coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching coupon', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const { coupon, error } = parseCouponInput(await request.json());
    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }
    if (await couponCodeTaken(db, coupon.code, id)) {
      return NextResponse.json({ message: 'Another discount already uses this code.' }, { status: 409 });
    }

    const { rowCount } = await db.query(`
      UPDATE coupons
      SET code = $1, discount_type = $2, discount_value = $3, expiration_date = $4, usage_limit = $5,
          minimum_purchase_amount = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [coupon.code, coupon.discount_type, coupon.discount_value, coupon.expiration_date, coupon.usage_limit, coupon.minimum_purchase_amount, coupon.is_active, id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error(`Error updating coupon ${id}:`, error);
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Another discount already uses this code.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating coupon', error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const { is_active } = await request.json();
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ message: 'is_active must be true or false.' }, { status: 400 });
    }
    const { rowCount } = await db.query(
      'UPDATE coupons SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, id]
    );
    if (rowCount === 0) return NextResponse.json({ message: 'Discount not found' }, { status: 404 });
    return NextResponse.json({ message: 'Coupon status updated', is_active });
  } catch (error) {
    console.error(`Error toggling coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error updating coupon status', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    // Deleting a used code would break the link from past orders (or fail for open ones)
    const { rows: [{ uses }] } = await db.query(`
      SELECT (
        (SELECT COUNT(*) FROM orders WHERE applied_coupon_id = $1) +
        (SELECT COUNT(*) FROM delivered_orders WHERE applied_coupon_id = $1) +
        (SELECT COUNT(*) FROM cancelled_orders WHERE applied_coupon_id = $1)
      )::int AS uses
    `, [id]);
    if (uses > 0) {
      return NextResponse.json({
        message: `This code was used on ${uses} order${uses !== 1 ? 's' : ''}, so it can't be deleted. Disable it instead to keep your order history intact.`,
      }, { status: 409 });
    }

    const { rowCount } = await db.query('DELETE FROM coupons WHERE id = $1', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Discount not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(`Error deleting coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting coupon', error: error.message }, { status: 500 });
  }
}
