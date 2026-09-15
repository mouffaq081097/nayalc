import db from './db.js';

// A checkout counts as abandoned once the customer has been inactive this long without ordering
export const ABANDONED_AFTER_MINUTES = 60;

let tableReady = null;

export function ensureCheckoutSessionsTable() {
  tableReady ??= (async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS checkout_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        items JSONB NOT NULL DEFAULT '[]',
        subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
        total NUMERIC(10,2),
        step TEXT NOT NULL DEFAULT 'address',
        payment_method TEXT,
        user_address_id INTEGER,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS checkout_sessions_user_updated_idx ON checkout_sessions (user_id, updated_at DESC)');
  })().catch(error => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

// Orders move between these tables as they're fulfilled or cancelled, so check all of them
const ALL_ORDERS = `
  SELECT user_id, created_at FROM orders
  UNION ALL SELECT user_id, created_at FROM delivered_orders
  UNION ALL SELECT user_id, created_at FROM cancelled_orders
`;

export async function recordCheckoutActivity({ userId, step, paymentMethod, addressId, items, total }) {
  await ensureCheckoutSessionsTable();

  // Price the cart from the database rather than trusting what the browser sent
  const { rows: products } = await db.query(`
    SELECT p.id, p.name, p.price,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url
    FROM products p
    WHERE p.id = ANY($1::int[])
  `, [items.map(i => i.productId)]);
  const productsById = new Map(products.map(p => [p.id, p]));

  const snapshot = items
    .filter(i => productsById.has(i.productId))
    .map(i => {
      const p = productsById.get(i.productId);
      return { productId: p.id, name: p.name, price: Number(p.price), quantity: i.quantity, imageUrl: p.image_url };
    });
  if (snapshot.length === 0) return;
  const subtotal = snapshot.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Continue the customer's latest checkout, unless it already became an order or has been idle for a day
  const { rows: [openSession] } = await db.query(`
    SELECT cs.id FROM checkout_sessions cs
    WHERE cs.user_id = $1
      AND cs.updated_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (SELECT 1 FROM (${ALL_ORDERS}) o WHERE o.user_id = cs.user_id AND o.created_at >= cs.started_at)
    ORDER BY cs.updated_at DESC
    LIMIT 1
  `, [userId]);

  if (openSession) {
    // Keep the furthest step reached — going back to change the address shouldn't hide that they got to payment
    await db.query(`
      UPDATE checkout_sessions
      SET items = $1, subtotal = $2, total = $3,
          step = CASE WHEN step = 'payment' THEN 'payment' ELSE $4 END,
          payment_method = $5, user_address_id = $6, updated_at = NOW()
      WHERE id = $7
    `, [JSON.stringify(snapshot), subtotal, total, step, paymentMethod, addressId, openSession.id]);
  } else {
    await db.query(`
      INSERT INTO checkout_sessions (user_id, items, subtotal, total, step, payment_method, user_address_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, JSON.stringify(snapshot), subtotal, total, step, paymentMethod, addressId]);
  }
}

// Checkouts from the last `days` days that didn't end in an order straight away.
// status: 'in_progress' (still active), 'abandoned' (no order), 'recovered' (ordered later, after abandoning)
export async function listAbandonedCheckouts({ days }) {
  await ensureCheckoutSessionsTable();
  const { rows } = await db.query(`
    SELECT * FROM (
      SELECT cs.id, cs.items, cs.subtotal, cs.total, cs.step, cs.payment_method, cs.started_at, cs.updated_at,
             u.id AS user_id, u.first_name, u.last_name, u.email,
             ua.city,
             COALESCE(ua.customer_phone, (
               SELECT a.customer_phone FROM user_addresses a
               WHERE a.user_id = u.id AND a.customer_phone IS NOT NULL
               ORDER BY a.is_default DESC NULLS LAST LIMIT 1
             )) AS customer_phone,
             CASE
               WHEN placed.first_order_at IS NULL AND cs.updated_at >= NOW() - make_interval(mins => $1) THEN 'in_progress'
               WHEN placed.first_order_at IS NULL THEN 'abandoned'
               WHEN placed.first_order_at > cs.updated_at + make_interval(mins => $1) THEN 'recovered'
               ELSE 'completed'
             END AS status
      FROM checkout_sessions cs
      JOIN users u ON u.id = cs.user_id
      LEFT JOIN user_addresses ua ON ua.id = cs.user_address_id AND ua.user_id = cs.user_id
      LEFT JOIN LATERAL (
        SELECT MIN(o.created_at) AS first_order_at
        FROM (${ALL_ORDERS}) o
        WHERE o.user_id = cs.user_id AND o.created_at >= cs.started_at
      ) placed ON TRUE
      WHERE cs.started_at > NOW() - make_interval(days => $2)
    ) sessions
    WHERE status <> 'completed'
    ORDER BY updated_at DESC
  `, [ABANDONED_AFTER_MINUTES, days]);
  return rows;
}

// Customers with items saved in their cart who haven't started a checkout in the last 30 days.
// user_carts doesn't record when items were added, so these have no date.
export async function listSavedCarts() {
  await ensureCheckoutSessionsTable();
  const { rows } = await db.query(`
    SELECT u.id AS user_id, u.first_name, u.last_name, u.email,
           (SELECT a.customer_phone FROM user_addresses a
            WHERE a.user_id = u.id AND a.customer_phone IS NOT NULL
            ORDER BY a.is_default DESC NULLS LAST LIMIT 1) AS customer_phone,
           JSON_AGG(JSON_BUILD_OBJECT(
             'productId', p.id, 'name', p.name, 'price', p.price, 'quantity', uc.quantity,
             'imageUrl', (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1)
           ) ORDER BY p.name) AS items,
           SUM(p.price * uc.quantity) AS subtotal
    FROM user_carts uc
    JOIN users u ON u.id = uc.user_id
    JOIN products p ON p.id = uc.product_id
    WHERE NOT EXISTS (
      SELECT 1 FROM checkout_sessions cs WHERE cs.user_id = u.id AND cs.updated_at > NOW() - INTERVAL '30 days'
    )
    GROUP BY u.id, u.first_name, u.last_name, u.email
    ORDER BY subtotal DESC
  `);
  return rows;
}
