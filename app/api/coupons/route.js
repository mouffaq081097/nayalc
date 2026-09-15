import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { COUPON_USAGE_COLUMNS, COUPON_USAGE_JOIN, couponCodeTaken, normalizeCoupon, parseCouponInput } from '@/lib/couponRules';

// Every discount code with how it has been used — admins only. Checkout uses /api/coupons/validate instead.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { rows } = await db.query(`
      SELECT c.*, ${COUPON_USAGE_COLUMNS}
      FROM coupons c
      ${COUPON_USAGE_JOIN}
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(rows.map(normalizeCoupon));
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ message: 'Error fetching coupons', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { coupon, error } = parseCouponInput(await request.json());
    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }
    if (await couponCodeTaken(db, coupon.code)) {
      return NextResponse.json({ message: 'Another discount already uses this code.' }, { status: 409 });
    }

    const { rows } = await db.query(`
      INSERT INTO coupons (code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [coupon.code, coupon.discount_type, coupon.discount_value, coupon.expiration_date, coupon.usage_limit, coupon.minimum_purchase_amount, coupon.is_active]);

    return NextResponse.json({ message: 'Coupon added successfully', couponId: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error adding coupon:', error);
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Another discount already uses this code.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error adding coupon', error: error.message }, { status: 500 });
  }
}
