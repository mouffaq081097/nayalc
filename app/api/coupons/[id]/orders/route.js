import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

// Orders that used a discount code, newest first, from every order table
export async function GET(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const { rows } = await db.query(`
      SELECT o.id, o.created_at, o.status, o.total_amount, o.discount_amount,
             u.id AS customer_id, u.first_name, u.last_name, u.email
      FROM (
        SELECT id, created_at, order_status AS status, total_amount, discount_amount, user_id FROM orders WHERE applied_coupon_id = $1
        UNION ALL
        SELECT id, created_at, 'Delivered', total_amount, discount_amount, user_id FROM delivered_orders WHERE applied_coupon_id = $1
        UNION ALL
        SELECT id, created_at, 'Cancelled', total_amount, discount_amount, user_id FROM cancelled_orders WHERE applied_coupon_id = $1
      ) o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [id]);
    return NextResponse.json(rows.map(o => ({
      ...o,
      total_amount: Number(o.total_amount) || 0,
      discount_amount: Number(o.discount_amount) || 0,
    })));
  } catch (error) {
    console.error(`Error fetching orders for coupon ${id}:`, error);
    return NextResponse.json({ message: 'Orders for this code could not be loaded', error: error.message }, { status: 500 });
  }
}
