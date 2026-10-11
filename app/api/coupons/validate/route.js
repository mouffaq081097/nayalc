import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureCouponProductsColumn, normalizeCoupon } from '@/lib/couponRules';
import { couponProductIds } from '@/lib/couponDiscount';

export async function POST(request) {
  try {
    const { code, totalAmount, productIds: cartProductIds = [] } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Coupon code is required.' }, { status: 400 });
    }

    await ensureCouponProductsColumn(db);
    const { rows } = await db.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Invalid coupon code.' }, { status: 400 });
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

    // A product-specific code needs at least one of its products in the cart
    const productIds = couponProductIds(coupon);
    if (productIds) {
      const inCart = Array.isArray(cartProductIds) ? cartProductIds.map(Number) : [];
      if (!productIds.some(id => inCart.includes(id))) {
        const { rows: products } = await db.query(
          'SELECT name FROM products WHERE id = ANY($1::int[]) ORDER BY name LIMIT 3',
          [productIds]
        );
        const names = products.map(p => p.name);
        const more = productIds.length > names.length ? ' and other selected products' : '';
        return NextResponse.json({
          message: names.length
            ? `This code only applies to ${names.join(', ')}${more}. Add ${productIds.length === 1 ? 'it' : 'one of them'} to your bag to use it.`
            : 'This code only applies to products that are not in your bag.',
        }, { status: 400 });
      }
    }

    return NextResponse.json(normalizeCoupon(coupon));

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ message: 'Error validating coupon', error: error.message }, { status: 500 });
  }
}
