import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { rows } = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ message: 'Error fetching coupons', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await db.connect();
  try {
    const { code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active } = await request.json();

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ message: 'Missing required fields (code, discount_type, discount_value).' }, { status: 400 });
    }

    await client.query('BEGIN');

    const sql = `
      INSERT INTO coupons (code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
    `;
    const values = [code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active];
    const { rows } = await client.query(sql, values);
    const couponId = rows[0].id;

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Coupon added successfully', couponId }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding coupon:', error);
    if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: 'Coupon code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error adding coupon', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
