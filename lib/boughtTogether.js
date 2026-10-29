import db from './db.js';

/**
 * "Frequently bought together" from real orders: the products found in the
 * same order as this one, most shared orders first. Open and delivered orders
 * count; cancelled orders and failed payments don't (as in lib/productReport.js).
 * A product needs MIN_SHARED_ORDERS orders in common before it is listed, so
 * one shopper's basket is never presented as what customers usually buy.
 */
export const MIN_SHARED_ORDERS = 2;

// Open and delivered orders are separate tables, so each order is keyed by its table too
const ORDER_LINES = `
  SELECT 'o' || o.id AS order_key, oi.product_id
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
   WHERE LOWER(COALESCE(o.order_status, '')) NOT IN ('cancelled', 'payment failed')
  UNION
  SELECT 'd' || o.id, oi.product_id
    FROM delivered_orders o JOIN delivered_order_items oi ON oi.order_id = o.id`;

/** [{ id, orders }] for the products most often ordered with `productId`. */
export async function getBoughtTogether(productId, limit = 6) {
  const { rows } = await db.query(
    `WITH lines AS (${ORDER_LINES})
     SELECT other.product_id AS id, COUNT(DISTINCT other.order_key)::int AS orders
       FROM lines mine
       JOIN lines other ON other.order_key = mine.order_key AND other.product_id <> mine.product_id
      WHERE mine.product_id = $1
      GROUP BY other.product_id
     HAVING COUNT(DISTINCT other.order_key) >= $2
      ORDER BY orders DESC, other.product_id DESC
      LIMIT $3`,
    [Number(productId), MIN_SHARED_ORDERS, limit],
  );
  return rows.map((r) => ({ id: Number(r.id), orders: Number(r.orders) }));
}
