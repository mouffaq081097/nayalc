import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

// Customer list for the admin portal, with order totals from every order table.
// Cancelled orders don't count towards orders or amount spent.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { rows } = await db.query(`
      WITH all_orders AS (
        SELECT user_id, total_amount, created_at, order_status FROM orders
        UNION ALL SELECT user_id, total_amount, created_at, 'Delivered' FROM delivered_orders
        UNION ALL SELECT user_id, total_amount, created_at, 'Cancelled' FROM cancelled_orders
      ),
      order_stats AS (
        SELECT user_id,
               COUNT(*) FILTER (WHERE LOWER(order_status) <> 'cancelled')::int AS orders_count,
               COALESCE(SUM(total_amount) FILTER (WHERE LOWER(order_status) <> 'cancelled'), 0) AS total_spent,
               MAX(created_at) FILTER (WHERE LOWER(order_status) <> 'cancelled') AS last_order_at
        FROM all_orders
        GROUP BY user_id
      )
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.profile_image, u.created_at,
             u.is_admin, COALESCE(u.is_suspended, false) AS is_suspended,
             COALESCE(u.loyalty_points, 0) AS loyalty_points, u.loyalty_tier,
             COALESCE(s.orders_count, 0) AS orders_count,
             COALESCE(s.total_spent, 0) AS total_spent,
             s.last_order_at,
             addr.city, addr.country
      FROM users u
      LEFT JOIN order_stats s ON s.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT a.city, a.country FROM user_addresses a
        WHERE a.user_id = u.id
        ORDER BY a.is_default DESC NULLS LAST, a.id
        LIMIT 1
      ) addr ON TRUE
      ORDER BY u.created_at DESC
    `);
    return NextResponse.json(rows.map(r => ({ ...r, total_spent: Number(r.total_spent) })));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ message: 'Customers could not be loaded.', error: error.message }, { status: 500 });
  }
}
