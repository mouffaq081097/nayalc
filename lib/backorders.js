import db from './db.js';
import { DEFAULT_BACKORDER_LEAD_DAYS, DEFAULT_BACKORDER_LIMIT, BACKORDER_DELAY_DAYS } from './backorderRules.js';
import { getPreorderInfo, formatShipDate } from './shipping.js';
import { sendPreorderReadyEmail, sendPreorderDelayEmail, sendPreorderAdminEmail } from './mail.js';

// Pre-orders (backorders). The storefront rules live in lib/backorderRules.js.
//
// How the stock adds up:
//   products.stock_quantity      units on the shelf and not yet promised to anyone (never negative)
//   order_items.backordered_qty  units of that line still owed: not on the shelf when it was bought
//
// placeOrder() takes what it can from the shelf and records the rest as owed,
// marking the order `awaiting_stock` with a `promised_ship_by` date. When stock
// goes up, allocateStock() hands the new units to the oldest owed lines first;
// an order with nothing left owed is released for shipping and the customer is
// told. OTO shipping, Shipped and Delivered are refused while an order waits.

const COLUMNS = {
  products: {
    allow_backorder:     'BOOLEAN NOT NULL DEFAULT FALSE',
    backorder_lead_days: `INTEGER NOT NULL DEFAULT ${DEFAULT_BACKORDER_LEAD_DAYS}`,
    backorder_limit:     `INTEGER NOT NULL DEFAULT ${DEFAULT_BACKORDER_LIMIT}`,
  },
  order_items: {
    backordered_qty: 'INTEGER NOT NULL DEFAULT 0',
  },
  orders: {
    awaiting_stock:   'BOOLEAN NOT NULL DEFAULT FALSE',
    promised_ship_by: 'DATE',
  },
};

// Also migration 014 in /api/admin/migrate. Checked once per server instance.
let columnsReady = null;
export function ensureBackorderColumns() {
  columnsReady ??= (async () => {
    const { rows } = await db.query(
      'SELECT table_name, column_name FROM information_schema.columns WHERE table_name = ANY($1)',
      [Object.keys(COLUMNS)]
    );
    for (const [table, columns] of Object.entries(COLUMNS)) {
      for (const [column, type] of Object.entries(columns)) {
        if (!rows.some(r => r.table_name === table && r.column_name === column)) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
        }
      }
    }
  })().catch(error => {
    columnsReady = null;
    throw error;
  });
  return columnsReady;
}

export const BACKORDER_MIGRATION_SQL = Object.entries(COLUMNS)
  .flatMap(([table, columns]) => Object.entries(columns).map(([column, type]) =>
    `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type};`))
  .join('\n');

// Units still owed on open orders, per product. Archived orders never owe anything.
const OWED_SQL = 'COALESCE((SELECT SUM(boi.backordered_qty) FROM order_items boi WHERE boi.product_id = p.id), 0)';

// Product columns for storefront queries (table alias `p`). `backorderable` is
// how many more units may be pre-ordered right now; `backordered_units` are owed.
export const BACKORDER_SELECT = `
  p.allow_backorder, p.backorder_lead_days, ${OWED_SQL}::int AS backordered_units,
  CASE WHEN p.allow_backorder THEN GREATEST(0, p.backorder_limit - ${OWED_SQL})::int ELSE 0 END AS backorderable`;

// The editor's three pre-order fields, read from a product form
export function readBackorderFields(get) {
  const int = (value, fallback, min, max) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  return {
    allow_backorder: get('allow_backorder') === 'true',
    backorder_lead_days: int(get('backorder_lead_days'), DEFAULT_BACKORDER_LEAD_DAYS, 1, 120),
    backorder_limit: int(get('backorder_limit'), DEFAULT_BACKORDER_LIMIT, 0, 10000),
  };
}

// Today's date in Dubai, which is what promised_ship_by is measured against
const DUBAI_TODAY = "(NOW() AT TIME ZONE 'Asia/Dubai')::date";

/**
 * Gives newly available stock to the oldest pre-orders first. Call it after
 * anything that raises stock_quantity: the product editor, a cancellation.
 * Orders left owing nothing are released (awaiting_stock = false) and the
 * customer and the team are emailed.
 *
 * Returns { allocated, released } — units handed out and order ids released.
 */
export async function allocateStock(productIds) {
  const ids = [...new Set((productIds || []).map(Number).filter(Boolean))];
  if (ids.length === 0) return { allocated: 0, released: [] };
  await ensureBackorderColumns();

  const client = await db.connect();
  let allocated = 0;
  let released = [];
  try {
    await client.query('BEGIN');
    const touchedOrders = new Set();

    // Lowest id first, the same lock order as placeOrder, so the two never deadlock
    for (const productId of ids.sort((a, b) => a - b)) {
      const { rows: [product] } = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE', [productId]
      );
      let shelf = Math.max(0, Number(product?.stock_quantity) || 0);
      if (shelf === 0) continue;

      const { rows: owed } = await client.query(`
        SELECT oi.id, oi.order_id, oi.backordered_qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = $1 AND oi.backordered_qty > 0
        ORDER BY o.created_at, o.id
        FOR UPDATE OF oi
      `, [productId]);

      for (const line of owed) {
        if (shelf === 0) break;
        const take = Math.min(shelf, line.backordered_qty);
        await client.query('UPDATE order_items SET backordered_qty = backordered_qty - $1 WHERE id = $2', [take, line.id]);
        shelf -= take;
        allocated += take;
        touchedOrders.add(line.order_id);
      }
      await client.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [shelf, productId]);
    }

    if (touchedOrders.size > 0) {
      const { rows } = await client.query(`
        UPDATE orders o SET awaiting_stock = false, updated_at = NOW()
        WHERE o.id = ANY($1) AND o.awaiting_stock
          AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.backordered_qty > 0)
        RETURNING o.id
      `, [[...touchedOrders]]);
      released = rows.map(r => r.id);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (released.length > 0) await notifyReleased(released);
  return { allocated, released };
}

async function orderContacts(orderIds) {
  const { rows } = await db.query(`
    SELECT o.id, o.payment_method, o.total_amount, o.promised_ship_by, u.email, COALESCE(u.first_name, 'Customer') AS first_name
    FROM orders o LEFT JOIN users u ON u.id = o.user_id
    WHERE o.id = ANY($1)
  `, [orderIds]);
  return rows;
}

async function orderLines(orderIds, { owedOnly = false } = {}) {
  const { rows } = await db.query(`
    SELECT oi.order_id, oi.quantity, oi.backordered_qty, oi.price, p.id AS "productId", p.name, pi.image_url
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = TRUE
    WHERE oi.order_id = ANY($1) ${owedOnly ? 'AND oi.backordered_qty > 0' : ''}
    ORDER BY oi.id
  `, [orderIds]);
  return rows;
}

async function notifyReleased(orderIds) {
  try {
    const [orders, lines] = await Promise.all([orderContacts(orderIds), orderLines(orderIds)]);
    for (const order of orders) {
      if (!order.email) continue;
      await sendPreorderReadyEmail(order.email, {
        firstName: order.first_name,
        orderId: order.id,
        items: lines.filter(l => l.order_id === order.id).map(l => ({ ...l, price: Number(l.price) })),
      });
    }
    await sendPreorderAdminEmail({
      ready: orders.map(o => ({ orderId: o.id, customerName: o.first_name })),
    });
  } catch (error) {
    // The release itself is committed; a failed email must not undo it
    console.error('Pre-order release emails failed:', error);
  }
}

/**
 * Daily check (/api/cron/backorders): every order still waiting after its
 * promised date gets a new date BACKORDER_DELAY_DAYS working days out, the
 * customer is told and offered a refund, and the team gets one summary.
 * Moving the date forward is what stops the same order being reported twice.
 */
export async function checkLatePreorders() {
  await ensureBackorderColumns();
  const { rows: late } = await db.query(`
    SELECT o.id, o.promised_ship_by::text AS promised_ship_by
    FROM orders o
    WHERE o.awaiting_stock AND o.promised_ship_by IS NOT NULL AND o.promised_ship_by < ${DUBAI_TODAY}
    ORDER BY o.promised_ship_by, o.id
  `);
  if (late.length === 0) return { late: 0 };

  const { shipByISO, shipByLabel } = getPreorderInfo(BACKORDER_DELAY_DAYS);
  const ids = late.map(o => o.id);
  await db.query('UPDATE orders SET promised_ship_by = $1, updated_at = NOW() WHERE id = ANY($2)', [shipByISO, ids]);

  const [contacts, owedLines] = await Promise.all([orderContacts(ids), orderLines(ids, { owedOnly: true })]);
  const summary = [];
  for (const order of late) {
    const contact = contacts.find(c => c.id === order.id) || {};
    const lines = owedLines.filter(l => l.order_id === order.id);
    if (contact.email) {
      await sendPreorderDelayEmail(contact.email, {
        firstName: contact.first_name,
        orderId: order.id,
        newShipBy: shipByLabel,
        items: lines.map(l => ({ ...l, quantity: l.backordered_qty, price: Number(l.price) })),
      });
    }
    summary.push({
      orderId: order.id,
      customerName: contact.first_name,
      waitingFor: lines.map(l => `${l.backordered_qty} × ${l.name}`).join(', '),
      wasDue: formatShipDate(order.promised_ship_by),
      newShipBy: shipByLabel,
    });
  }
  await sendPreorderAdminEmail({ late: summary });
  return { late: late.length, newShipBy: shipByISO };
}

/**
 * The logistics view: what we owe, per product, and the orders waiting on it.
 * Also a purchase list for the supplier.
 */
export async function getBackorderOverview() {
  await ensureBackorderColumns();
  const { rows: products } = await db.query(`
    SELECT p.id, p.name, p.stock_quantity, p.allow_backorder, p.backorder_lead_days, p.backorder_limit,
           COALESCE(b.name, '') AS brand,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url,
           SUM(oi.backordered_qty)::int AS owed,
           COUNT(DISTINCT oi.order_id)::int AS order_count,
           MIN(o.created_at) AS oldest_order_at,
           MIN(o.promised_ship_by)::text AS earliest_promise,
           BOOL_OR(o.promised_ship_by < ${DUBAI_TODAY}) AS is_late
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE oi.backordered_qty > 0
    GROUP BY p.id, b.name
    ORDER BY MIN(o.promised_ship_by), p.name
  `);

  const { rows: orders } = await db.query(`
    SELECT o.id, o.created_at, o.promised_ship_by::text AS promised_ship_by, o.payment_method, o.total_amount, o.order_status,
           (o.promised_ship_by < ${DUBAI_TODAY}) AS is_late,
           COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), 'Customer') AS customer_name,
           JSON_AGG(JSON_BUILD_OBJECT('productId', p.id, 'name', p.name, 'quantity', oi.quantity, 'owed', oi.backordered_qty) ORDER BY oi.id) AS items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN users u ON u.id = o.user_id
    WHERE o.awaiting_stock
    GROUP BY o.id, u.first_name, u.last_name
    ORDER BY o.promised_ship_by, o.id
  `);

  // Products that take pre-orders, so the team can see what is switched on
  const { rows: enabled } = await db.query(`
    SELECT p.id, p.name, p.stock_quantity, p.backorder_lead_days, p.backorder_limit, ${OWED_SQL}::int AS owed
    FROM products p
    WHERE p.allow_backorder
    ORDER BY p.name
  `);

  return { products, orders, enabled };
}
