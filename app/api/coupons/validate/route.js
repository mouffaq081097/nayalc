import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { code, totalAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Coupon code is required.' }, { status: 400 });
    }

    const { rows } = await db.query('SELECT * FROM coupons WHERE code = $1', [code]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Invalid coupon code.' }, { status: 404 });
    }

    const coupon = rows[0];

    if (!coupon.is_active) {
      return NextResponse.json({ message: 'This coupon is not active.' }, { status: 400 });
    }

    if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
      return NextResponse.json({ message: 'This coupon has expired.' }, { status: 400 });
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ message: 'This coupon has reached its usage limit.' }, { status: 400 });
    }

    if (coupon.minimum_purchase_amount !== null && totalAmount < coupon.minimum_purchase_amount) {
      return NextResponse.json({ message: `You must spend at least ${coupon.minimum_purchase_amount} to use this coupon.` }, { status: 400 });
    }

    return NextResponse.json(coupon);

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ message: 'Error validating coupon', error: error.message }, { status: 500 });
  }
}
