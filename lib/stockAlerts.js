import db from './db.js';
import { sendBackInStockEmail } from './mail.js';
import { BASE } from './email/theme.js';

/**
 * "Email me when it's back": shoppers leave an email on a sold-out product
 * (POST /api/stock-alerts) and get one email when stock returns.
 *
 * allocateStock() calls notifyStockAlerts() after every stock rise (product
 * editor, cancellations, goods received), and the daily customer-emails cron
 * sweeps anything that run couldn't send.
 */

export const STOCK_ALERTS_MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS stock_alerts (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    user_id     INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ
  );
  CREATE UNIQUE INDEX IF NOT EXISTS stock_alerts_one_waiting
    ON stock_alerts (product_id, LOWER(email)) WHERE notified_at IS NULL;
`;

let ensured = false;
export async function ensureStockAlertsTable() {
  if (ensured) return;
  await db.query(STOCK_ALERTS_MIGRATION_SQL);
  ensured = true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value) => typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value.trim());

/** Adds a waiting alert; a second request for the same product and email is ignored. */
export async function addStockAlert({ productId, email, userId = null }) {
  await ensureStockAlertsTable();
  await db.query(
    `INSERT INTO stock_alerts (product_id, email, user_id) VALUES ($1, $2, $3)
     ON CONFLICT (product_id, LOWER(email)) WHERE notified_at IS NULL DO NOTHING`,
    [Number(productId), email.trim(), userId ? Number(userId) : null],
  );
}

/**
 * Emails everyone waiting for these products (or for any product, when
 * `productIds` is omitted) that now has shelf stock. Each alert is sent once.
 */
export async function notifyStockAlerts(productIds = null, { limit = 100 } = {}) {
  await ensureStockAlertsTable();
  const ids = productIds ? [...new Set(productIds.map(Number).filter(Boolean))] : null;
  if (ids && ids.length === 0) return { sent: 0, failed: 0 };

  const { rows } = await db.query(
    `SELECT a.id, a.email, p.id AS product_id, p.name, p.slug, p.price,
            (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url
       FROM stock_alerts a
       JOIN products p ON p.id = a.product_id
      WHERE a.notified_at IS NULL
        AND p.stock_quantity > 0
        AND p.is_active = TRUE AND (p.status = 'active' OR p.status IS NULL)
        ${ids ? 'AND a.product_id = ANY($2)' : ''}
      ORDER BY a.created_at
      LIMIT $1`,
    ids ? [limit, ids] : [limit],
  );

  const result = { sent: 0, failed: 0 };
  for (const alert of rows) {
    // Claim it first, so overlapping runs never send twice
    const claim = await db.query(
      'UPDATE stock_alerts SET notified_at = NOW() WHERE id = $1 AND notified_at IS NULL RETURNING id',
      [alert.id],
    );
    if (!claim.rowCount) continue;

    const sent = await sendBackInStockEmail(alert.email, {
      product: {
        name: alert.name,
        price: Number(alert.price),
        imageUrl: alert.image_url,
        url: `${BASE}/product/${encodeURIComponent(alert.slug || alert.product_id)}`,
      },
    });
    if (sent.success) {
      result.sent += 1;
    } else {
      result.failed += 1;
      await db.query('UPDATE stock_alerts SET notified_at = NULL WHERE id = $1', [alert.id]);
    }
  }
  return result;
}

/** Admin view: how many people wait for each product. */
export async function waitingCounts() {
  await ensureStockAlertsTable();
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.stock_quantity, COUNT(a.id)::int AS waiting, MIN(a.created_at) AS since
       FROM stock_alerts a
       JOIN products p ON p.id = a.product_id
      WHERE a.notified_at IS NULL
      GROUP BY p.id
      ORDER BY COUNT(a.id) DESC, p.name`,
  );
  return rows;
}
