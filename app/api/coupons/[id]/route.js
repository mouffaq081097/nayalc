import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = params;
  try {
    const { rows } = await db.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching coupon', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
    const { id } = params;
    const client = await db.connect();
    try {
        const { code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active } = await request.json();

        if (!code || !discount_type || !discount_value) {
            return NextResponse.json({ message: 'Missing required fields (code, discount_type, discount_value).' }, { status: 400 });
        }

        await client.query('BEGIN');

        const sql = `
            UPDATE coupons
            SET code = $1, discount_type = $2, discount_value = $3, expiration_date = $4, usage_limit = $5, minimum_purchase_amount = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8;
        `;
        const values = [code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active, id];
        const result = await client.query(sql, values);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Coupon updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating coupon ${id}:`, error);
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ message: 'Coupon code already exists.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error updating coupon', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const deleteResult = await client.query('DELETE FROM coupons WHERE id = $1', [id]);

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Coupon deleted successfully' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting coupon', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
