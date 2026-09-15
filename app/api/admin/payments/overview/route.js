import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

// Sales by payment method from the store's own orders, plus cash-on-delivery orders still to be delivered
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const [methods, codOpen] = await Promise.all([
      db.query(`
        WITH all_orders AS (
          SELECT payment_method, total_amount, created_at, LOWER(order_status) AS status FROM orders
          UNION ALL SELECT payment_method, total_amount, created_at, 'delivered' FROM delivered_orders
          UNION ALL SELECT payment_method, total_amount, created_at, 'cancelled' FROM cancelled_orders
        )
        SELECT payment_method AS method,
               COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
               COALESCE(SUM(total_amount) FILTER (WHERE status <> 'cancelled'), 0) AS sales,
               COUNT(*) FILTER (WHERE status <> 'cancelled' AND created_at >= NOW() - INTERVAL '30 days')::int AS orders_30d,
               COALESCE(SUM(total_amount) FILTER (WHERE status <> 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'), 0) AS sales_30d,
               COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_orders,
               COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS delivered_sales,
               COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled'))::int AS open_orders,
               COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('delivered', 'cancelled')), 0) AS open_sales
        FROM all_orders
        GROUP BY payment_method
        ORDER BY sales DESC
      `),
      db.query(`
        SELECT o.id, o.created_at, o.order_status AS status, o.total_amount,
               u.id AS customer_id, u.first_name, u.last_name, u.email,
               ua.customer_phone, ua.city
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN user_addresses ua ON ua.id = o.user_address_id
        WHERE LOWER(o.payment_method) IN ('cashondelivery', 'cash')
          AND LOWER(o.order_status) NOT IN ('delivered', 'cancelled')
        ORDER BY o.created_at ASC
        LIMIT 100
      `),
    ]);

    const money = ['sales', 'sales_30d', 'delivered_sales', 'open_sales'];
    return NextResponse.json({
      methods: methods.rows.map(row => ({ ...row, ...Object.fromEntries(money.map(key => [key, Number(row[key])])) })),
      cod_open: codOpen.rows.map(row => ({ ...row, total_amount: Number(row.total_amount) })),
    });
  } catch (error) {
    console.error('Error building payments overview:', error);
    return NextResponse.json({ message: 'The payments overview could not be loaded.', error: error.message }, { status: 500 });
  }
}
