import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = params;
  try {
    const { rows } = await db.query(`
      SELECT 
        id, order_status, total_amount, created_at, user_name, user_email
      FROM (
        SELECT o.id, o.order_status, o.total_amount, o.created_at, u.first_name as user_name, u.email as user_email
        FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.applied_coupon_id = $1
        UNION ALL
        SELECT d.id, d.order_status, d.total_amount, d.created_at, u.first_name as user_name, u.email as user_email
        FROM delivered_orders d LEFT JOIN users u ON d.user_id = u.id WHERE d.applied_coupon_id = $1
        UNION ALL
        SELECT c.id, c.order_status, c.total_amount, c.created_at, u.first_name as user_name, u.email as user_email
        FROM cancelled_orders c LEFT JOIN users u ON c.user_id = u.id WHERE c.applied_coupon_id = $1
      ) all_orders
      ORDER BY created_at DESC
    `, [id]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(`Error fetching orders for coupon ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching orders for coupon', error: error.message }, { status: 500 });
  }
}
