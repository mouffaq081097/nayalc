import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

// Everything the admin customer page shows: profile, order stats and history, addresses, loyalty and saved cart
export async function GET(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const { rows: [customer] } = await db.query(`
      SELECT id, first_name, last_name, email, phone_number, profile_image, created_at,
             is_admin, COALESCE(is_suspended, false) AS is_suspended, COALESCE(email_verified, true) AS email_verified,
             COALESCE(loyalty_points, 0) AS loyalty_points, loyalty_tier, COALESCE(lifetime_spend, 0) AS lifetime_spend
      FROM users WHERE id = $1
    `, [id]);
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    const ordersSql = `
      SELECT o.id, o.total_amount, o.order_status, o.created_at, o.payment_method, o.payment_confirmed,
             (SELECT COALESCE(SUM(i.quantity), 0)::int FROM order_items i WHERE i.order_id = o.id) AS items
      FROM orders o WHERE o.user_id = $1
      UNION ALL
      SELECT o.id, o.total_amount, 'Delivered', o.created_at, o.payment_method, o.payment_confirmed,
             (SELECT COALESCE(SUM(i.quantity), 0)::int FROM delivered_order_items i WHERE i.order_id = o.id)
      FROM delivered_orders o WHERE o.user_id = $1
      UNION ALL
      SELECT o.id, o.total_amount, 'Cancelled', o.created_at, o.payment_method, o.payment_confirmed,
             (SELECT COALESCE(SUM(i.quantity), 0)::int FROM cancelled_order_items i WHERE i.order_id = o.id)
      FROM cancelled_orders o WHERE o.user_id = $1
    `;

    const [statsResult, ordersResult, addressesResult, loyaltyResult, cartResult] = await Promise.all([
      db.query(`
        SELECT COUNT(*) FILTER (WHERE LOWER(order_status) <> 'cancelled')::int AS orders_count,
               COUNT(*) FILTER (WHERE LOWER(order_status) = 'cancelled')::int AS cancelled_count,
               COALESCE(SUM(total_amount) FILTER (WHERE LOWER(order_status) <> 'cancelled'), 0) AS total_spent,
               MAX(created_at) FILTER (WHERE LOWER(order_status) <> 'cancelled') AS last_order_at
        FROM (${ordersSql}) all_orders
      `, [id]),
      db.query(`SELECT * FROM (${ordersSql}) all_orders ORDER BY created_at DESC LIMIT 25`, [id]),
      db.query(`
        SELECT id, address_label, address_line1, address_line2, shipping_address, city, state, zip_code, country, customer_phone, is_default
        FROM user_addresses WHERE user_id = $1
        ORDER BY is_default DESC NULLS LAST, id
      `, [id]),
      db.query(`
        SELECT id, type, points, description, created_at
        FROM loyalty_transactions WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 20
      `, [id]),
      db.query(`
        SELECT p.id AS "productId", p.name, p.price, uc.quantity,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS "imageUrl"
        FROM user_carts uc JOIN products p ON p.id = uc.product_id
        WHERE uc.user_id = $1
        ORDER BY p.name
      `, [id]),
    ]);

    const stats = statsResult.rows[0];
    return NextResponse.json({
      customer: { ...customer, lifetime_spend: Number(customer.lifetime_spend) },
      stats: { ...stats, total_spent: Number(stats.total_spent) },
      orders: ordersResult.rows.map(o => ({ ...o, total_amount: Number(o.total_amount) })),
      addresses: addressesResult.rows,
      loyalty: loyaltyResult.rows,
      cart: cartResult.rows.map(item => ({ ...item, price: Number(item.price) })),
    });
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    return NextResponse.json({ message: 'This customer could not be loaded.', error: error.message }, { status: 500 });
  }
}
