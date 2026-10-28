import db from './db.js';
import { createReviewToken } from './reviewTokens.js';
import { sendReviewRequestEmail } from './mail.js';
import { BASE } from './email/theme.js';

/**
 * A few days after an order is delivered, email the customer one tap-to-rate
 * card per product they haven't reviewed yet. Run daily by
 * /api/cron/review-requests. Each order is asked once; the time is kept in
 * delivered_orders.review_requested_at.
 */

export const REVIEW_REQUEST_MIGRATION_SQL = `
  ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;
`;

let ensured = false;
export async function ensureReviewRequestColumn() {
  if (ensured) return;
  await db.query(REVIEW_REQUEST_MIGRATION_SQL);
  ensured = true;
}

// Long enough to have tried the product
const AFTER_DAYS = 5;
// Older deliveries are left alone, which also keeps the first run small
const WINDOW_DAYS = 21;

export async function sendDueReviewRequests({ limit = 40 } = {}) {
  await ensureReviewRequestColumn();

  const { rows: orders } = await db.query(
    `SELECT o.id, o.user_id, u.email, u.first_name
       FROM delivered_orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.review_requested_at IS NULL
        AND o.delivered_at <= NOW() - INTERVAL '${AFTER_DAYS} days'
        AND o.delivered_at >  NOW() - INTERVAL '${WINDOW_DAYS} days'
        AND u.email IS NOT NULL
      ORDER BY o.delivered_at ASC
      LIMIT $1`,
    [limit],
  );

  const result = { checked: orders.length, sent: 0, skipped: 0, failed: 0 };

  for (const order of orders) {
    // Claim the order first, so two overlapping runs can never email twice
    const claim = await db.query(
      'UPDATE delivered_orders SET review_requested_at = NOW() WHERE id = $1 AND review_requested_at IS NULL RETURNING id',
      [order.id],
    );
    if (!claim.rowCount) continue;

    // Products still on sale that this customer hasn't reviewed
    const { rows: products } = await db.query(
      `SELECT DISTINCT p.id, p.name, p.slug,
              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url
         FROM delivered_order_items i
         JOIN products p ON p.id = i.product_id
        WHERE i.order_id = $1
          AND p.is_active = TRUE
          AND (p.status = 'active' OR p.status IS NULL)
          AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id AND r.user_id = $2)
        ORDER BY p.id
        LIMIT 6`,
      [order.id, order.user_id],
    );
    if (!products.length) { result.skipped += 1; continue; }

    const sent = await sendReviewRequestEmail(order.email, {
      firstName: order.first_name,
      orderId: order.id,
      items: products.map((p) => ({
        name: p.name,
        imageUrl: p.image_url,
        url: `${BASE}/product/${encodeURIComponent(p.slug || p.id)}?rt=${createReviewToken(order.user_id, p.id)}`,
      })),
    });

    if (sent.success) {
      result.sent += 1;
    } else {
      // Let tomorrow's run try again
      result.failed += 1;
      await db.query('UPDATE delivered_orders SET review_requested_at = NULL WHERE id = $1', [order.id]);
    }
  }

  return result;
}
