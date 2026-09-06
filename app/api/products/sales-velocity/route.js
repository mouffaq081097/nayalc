import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Real units-sold-in-the-last-24h per product, from actual order line items
// (pending/processing orders + delivered orders — cancelled orders don't count as sold).
export async function GET() {
  try {
    const { rows } = await db.query(`
      SELECT product_id AS "productId", SUM(quantity)::int AS units
      FROM (
        SELECT oi.product_id, oi.quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT oi.product_id, oi.quantity
        FROM delivered_order_items oi
        JOIN delivered_orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '24 hours'
      ) sold
      GROUP BY product_id
    `);

    const velocity = {};
    for (const r of rows) velocity[r.productId] = Number(r.units);

    return NextResponse.json({ velocity });
  } catch (e) {
    console.error('products/sales-velocity error:', e);
    return NextResponse.json({ velocity: {} }, { status: 200 });
  }
}
