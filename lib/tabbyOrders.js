import db from './db.js';
import { placeOrder } from './placeOrder.js';

// A Tabby order is only created once the customer has paid on Tabby's site. Its details are saved
// here before they leave, so the order can be created from the server — by the return page or by
// Tabby's webhook — even if they come back in another browser, app or tab, or never come back.

// Delivered and cancelled orders keep their Tabby payment ID, so a payment can always be traced to its order.
// Checks the catalog first: ALTER TABLE locks the table even when the column already exists.
let columnsReady = null;
export function ensureTabbyPaymentColumns() {
  columnsReady ??= (async () => {
    const tables = ['orders', 'delivered_orders', 'cancelled_orders'];
    const { rows } = await db.query(
      "SELECT table_name FROM information_schema.columns WHERE column_name = 'tabby_payment_id' AND table_name = ANY($1)",
      [tables]
    );
    for (const table of tables.filter(t => !rows.some(r => r.table_name === t))) {
      await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tabby_payment_id VARCHAR(255)`);
    }
  })().catch(error => {
    columnsReady = null;
    throw error;
  });
  return columnsReady;
}

let tableReady = null;

export function ensureTabbyPendingTable() {
  tableReady ??= db.query(`
    CREATE TABLE IF NOT EXISTS tabby_pending_orders (
      id SERIAL PRIMARY KEY,
      tabby_payment_id TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_data JSONB NOT NULL,
      amount NUMERIC(10,2),
      order_id INTEGER,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(error => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export async function savePendingTabbyOrder({ paymentId, userId, orderData, amount }) {
  await ensureTabbyPendingTable();
  await db.query(`
    INSERT INTO tabby_pending_orders (tabby_payment_id, user_id, order_data, amount)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (tabby_payment_id) DO UPDATE SET order_data = EXCLUDED.order_data, amount = EXCLUDED.amount, updated_at = NOW()
  `, [paymentId, userId, JSON.stringify(orderData), amount]);
}

export async function getPendingTabbyOrder(paymentId) {
  await ensureTabbyPendingTable();
  const { rows } = await db.query('SELECT * FROM tabby_pending_orders WHERE tabby_payment_id = $1', [paymentId]);
  return rows[0] || null;
}

// Orders move to these tables once delivered or cancelled, so a payment's order can be in any of them
export async function findOrderForTabbyPayment(paymentId) {
  await ensureTabbyPaymentColumns();
  const { rows } = await db.query(`
    SELECT id FROM orders WHERE tabby_payment_id = $1
    UNION ALL SELECT id FROM delivered_orders WHERE tabby_payment_id = $1
    UNION ALL SELECT id FROM cancelled_orders WHERE tabby_payment_id = $1
    LIMIT 1
  `, [paymentId]);
  return rows[0]?.id ?? null;
}

// Tabby orders recovered by hand before payment IDs were recorded have no tabby_payment_id.
// Returns such orders for these customer emails, so a payment isn't mistaken for having no order.
export async function findUnlinkedTabbyOrders(emails) {
  const list = [...new Set(emails.filter(Boolean).map(e => e.toLowerCase()))];
  if (list.length === 0) return [];
  await ensureTabbyPaymentColumns();
  const { rows } = await db.query(`
    SELECT o.id, o.total_amount, o.created_at, LOWER(u.email) AS email FROM (
      SELECT id, user_id, total_amount, created_at, payment_method, tabby_payment_id FROM orders
      UNION ALL SELECT id, user_id, total_amount, created_at, payment_method, tabby_payment_id FROM delivered_orders
      UNION ALL SELECT id, user_id, total_amount, created_at, payment_method, tabby_payment_id FROM cancelled_orders
    ) o
    JOIN users u ON u.id = o.user_id
    WHERE o.payment_method = 'tabby' AND o.tabby_payment_id IS NULL AND LOWER(u.email) = ANY($1)
    ORDER BY o.created_at DESC
  `, [list]);
  return rows;
}

// Creates the order for a paid Tabby payment from its saved checkout. Safe to call more than once.
// Returns { status, body }: 201 created, 409 already had an order, 404 no saved checkout, else an error.
export async function completeTabbyOrder(paymentId) {
  const existingId = await findOrderForTabbyPayment(paymentId);
  if (existingId) return { status: 409, body: { message: 'Order already created for this payment.', orderId: existingId } };

  const pending = await getPendingTabbyOrder(paymentId);
  if (!pending) return { status: 404, body: { message: 'No saved checkout for this Tabby payment.' } };
  if (pending.order_id) return { status: 409, body: { message: 'Order already created for this payment.', orderId: pending.order_id } };

  // placeOrder checks with Tabby that the payment is authorized and for the right amount
  const result = await placeOrder({
    ...pending.order_data,
    user_id: pending.user_id,
    payment_method: 'tabby',
    tabby_payment_id: paymentId,
  });

  if (result.status === 201 || result.status === 409) {
    const orderId = result.body.orderId;
    await db.query(
      'UPDATE tabby_pending_orders SET order_id = $1, last_error = NULL, updated_at = NOW() WHERE id = $2',
      [orderId, pending.id]
    );
    if (result.status === 201) {
      // Tabby has confirmed the payment, so the order doesn't wait for the webhook (which may already have come)
      await db.query(
        "UPDATE orders SET payment_confirmed = true, order_status = 'Processing', updated_at = NOW() WHERE id = $1",
        [orderId]
      );
      // The customer may not come back to this browser to empty their bag
      await db.query('DELETE FROM user_carts WHERE user_id = $1', [pending.user_id]);
    }
  } else {
    await db.query(
      'UPDATE tabby_pending_orders SET last_error = $1, updated_at = NOW() WHERE id = $2',
      [result.body?.message || `Error ${result.status}`, pending.id]
    );
    console.error(`Tabby payment ${paymentId}: order could not be created —`, result.body?.message);
  }
  return result;
}
