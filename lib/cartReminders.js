import { createHmac, timingSafeEqual } from 'node:crypto';
import db from './db.js';
import { BASE } from './email/theme.js';
import { ensureCheckoutSessionsTable, ABANDONED_AFTER_MINUTES } from './checkoutSessions.js';
import { sendCartReminderEmail } from './mail.js';
import { FREE_SHIPPING_FROM, TRANSIT_LABEL } from './shipping.js';
import { RETURN_WINDOW_DAYS } from './policies.js';

/**
 * "You left something in your bag" emails.
 *
 * - Automatic: the daily customer-emails cron calls sendDueCartReminders() for
 *   checkouts abandoned in the last 3 days (idle for ABANDONED_AFTER_MINUTES,
 *   no order since). One per checkout, and at most one per customer per week.
 *   CART_REMINDER_COUPON (an existing discount code) is added when set.
 * - By hand: Admin → Orders → Abandoned checkouts → "Send reminder", for a
 *   checkout or a saved cart, with an optional discount code.
 *
 * The email lists the customer's live bag (current prices, buyable items only)
 * and links to /cart?restore=…, which puts the items back in the bag on any
 * device and applies the code. Every email carries a one-click "Stop bag
 * reminders" link (users.cart_reminders_off).
 */

export const AUTO_WINDOW_DAYS = 3;
export const MIN_DAYS_BETWEEN = 7;
export const MANUAL_MIN_HOURS_BETWEEN = 12;

export const CART_REMINDER_MIGRATION_SQL = `
  ALTER TABLE IF EXISTS checkout_sessions ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
  ALTER TABLE IF EXISTS checkout_sessions ADD COLUMN IF NOT EXISTS reminder_coupon TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS cart_reminder_sent_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS cart_reminders_off BOOLEAN NOT NULL DEFAULT FALSE;
`;

let ready = null;
/** Adds the columns when missing (looks first, so a warm database is never locked). */
export function ensureCartReminderColumns() {
  ready ??= (async () => {
    await ensureCheckoutSessionsTable();
    const { rows } = await db.query(
      `SELECT table_name || '.' || column_name AS col FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND ((table_name = 'checkout_sessions' AND column_name IN ('reminder_sent_at', 'reminder_coupon'))
           OR (table_name = 'users' AND column_name IN ('cart_reminder_sent_at', 'cart_reminders_off')))`,
    );
    if (rows.length < 4) await db.query(CART_REMINDER_MIGRATION_SQL);
  })().catch((error) => { ready = null; throw error; });
  return ready;
}

export class CartReminderError extends Error {}

// ── Unsubscribe links ──────────────────────────────────────────────────────

const secret = () => process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
const sign = (userId) => createHmac('sha256', secret()).update(`cart-reminders-off:${userId}`).digest('base64url').slice(0, 32);

export const unsubscribeUrl = (userId) => `${BASE}/api/email/unsubscribe?u=${userId}&t=${sign(userId)}`;

export function checkUnsubscribeToken(userId, token) {
  if (!secret() || !/^\d+$/.test(String(userId)) || typeof token !== 'string') return false;
  const a = Buffer.from(sign(userId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function turnOffCartReminders(userId) {
  await ensureCartReminderColumns();
  await db.query('UPDATE users SET cart_reminders_off = TRUE WHERE id = $1', [Number(userId)]);
}

// ── The bag ────────────────────────────────────────────────────────────────

// Buyable now: active, and on the shelf or open to pre-orders
const BUYABLE = `p.is_active IS NOT FALSE AND (p.status = 'active' OR p.status IS NULL)
  AND (p.stock_quantity > 0 OR COALESCE(p.allow_backorder, FALSE))`;

const PRODUCT_FIELDS = `p.id, p.name, p.slug, p.price, p.comparedprice, b.name AS brand,
  (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url`;

/** The customer's bag at today's prices: what's in user_carts, else what they had at checkout. */
async function liveBag(userId, sessionItems = []) {
  const { rows: cart } = await db.query(
    `SELECT ${PRODUCT_FIELDS}, uc.quantity
     FROM user_carts uc JOIN products p ON p.id = uc.product_id LEFT JOIN brands b ON b.id = p.brand_id
     WHERE uc.user_id = $1 AND ${BUYABLE}
     ORDER BY p.price DESC`,
    [userId],
  );
  let rows = cart;
  if (rows.length === 0 && sessionItems.length) {
    const qty = new Map(sessionItems.map((i) => [Number(i.productId), Number(i.quantity) || 1]));
    const { rows: products } = await db.query(
      `SELECT ${PRODUCT_FIELDS} FROM products p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = ANY($1::int[]) AND ${BUYABLE} ORDER BY p.price DESC`,
      [[...qty.keys()]],
    );
    rows = products.map((p) => ({ ...p, quantity: qty.get(p.id) }));
  }
  const items = rows.map((r) => ({
    productId: r.id,
    name: r.name,
    brand: r.brand,
    price: Number(r.price),
    originalPrice: r.comparedprice ? Number(r.comparedprice) : null,
    quantity: Math.max(1, Number(r.quantity) || 1),
    imageUrl: r.image_url,
  }));
  return { items, subtotal: Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100 };
}

async function loadCoupon(code) {
  const clean = String(code || '').trim();
  if (!clean) return null;
  const { rows: [coupon] } = await db.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [clean]);
  if (!coupon) throw new CartReminderError(`There’s no discount code "${clean}".`);
  if (!coupon.is_active) throw new CartReminderError(`${coupon.code} is switched off.`);
  if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) throw new CartReminderError(`${coupon.code} has expired.`);
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) throw new CartReminderError(`${coupon.code} has been used up.`);
  const value = Number(coupon.discount_value);
  const label = coupon.discount_type === 'percentage'
    ? `${value}% off your bag`
    : `AED ${value % 1 ? value.toFixed(2) : value} off your bag`;
  return {
    code: coupon.code,
    label: Number(coupon.minimum_purchase_amount) > 0 ? `${label} (orders from AED ${Number(coupon.minimum_purchase_amount)})` : label,
    validUntil: coupon.expiration_date
      ? new Date(coupon.expiration_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Dubai' })
      : null,
  };
}

const restoreUrl = (items, coupon) => {
  const params = new URLSearchParams({
    restore: items.map((i) => `${i.productId}x${i.quantity}`).join('.'),
    utm_source: 'email', utm_medium: 'email', utm_campaign: 'cart_reminder',
  });
  if (coupon) params.set('code', coupon.code);
  return `${BASE}/cart?${params}`;
};

const FACTS = [
  `Free delivery from ${FREE_SHIPPING_FROM} items`,
  `Delivered in ${TRANSIT_LABEL}`,
  `${RETURN_WINDOW_DAYS}-day returns`,
  'Pay later with Tabby',
];

// ── Sending ────────────────────────────────────────────────────────────────

/**
 * Sends one reminder. { userId, sessionId?, couponCode?, manual? }
 * Returns { sent: true, items } or throws CartReminderError with a reason.
 */
export async function sendCartReminder({ userId, sessionId = null, couponCode = null, manual = false }) {
  await ensureCartReminderColumns();
  const { rows: [user] } = await db.query(
    `SELECT id, email, first_name, cart_reminders_off, cart_reminder_sent_at, COALESCE(is_suspended, false) AS suspended
     FROM users WHERE id = $1`, [Number(userId)],
  );
  if (!user?.email) throw new CartReminderError('This customer has no email address.');
  if (user.suspended) throw new CartReminderError('This customer’s account is suspended.');
  if (user.cart_reminders_off) throw new CartReminderError('This customer turned off bag reminders.');
  const hoursSince = user.cart_reminder_sent_at ? (Date.now() - new Date(user.cart_reminder_sent_at).getTime()) / 3_600_000 : Infinity;
  if (manual && hoursSince < MANUAL_MIN_HOURS_BETWEEN) {
    throw new CartReminderError(`A reminder went to this customer ${Math.max(1, Math.round(hoursSince))} hour(s) ago. Wait a little before sending another.`);
  }

  let sessionItems = [];
  if (sessionId) {
    const { rows: [session] } = await db.query('SELECT items FROM checkout_sessions WHERE id = $1 AND user_id = $2', [Number(sessionId), user.id]);
    if (!session) throw new CartReminderError('That checkout doesn’t belong to this customer.');
    sessionItems = session.items || [];
  }

  const coupon = await loadCoupon(couponCode);
  const { items, subtotal } = await liveBag(user.id, sessionItems);
  if (items.length === 0) throw new CartReminderError('Nothing in this bag can be bought right now (sold out or hidden).');

  const result = await sendCartReminderEmail(user.email, {
    firstName: user.first_name,
    items,
    subtotal,
    coupon,
    restoreUrl: restoreUrl(items, coupon),
    unsubscribeUrl: unsubscribeUrl(user.id),
    facts: FACTS,
  });
  if (!result.success) throw new CartReminderError(`The email couldn’t be sent: ${result.error || 'mail server error'}.`);

  await db.query('UPDATE users SET cart_reminder_sent_at = NOW() WHERE id = $1', [user.id]);
  if (sessionId) {
    await db.query('UPDATE checkout_sessions SET reminder_sent_at = NOW(), reminder_coupon = $2 WHERE id = $1', [Number(sessionId), coupon?.code ?? null]);
  }
  return { sent: true, items: items.length, subtotal, coupon: coupon?.code ?? null };
}

/** Daily: one reminder for each customer's latest checkout abandoned in the last few days. */
export async function sendDueCartReminders({ limit = 50 } = {}) {
  await ensureCartReminderColumns();
  const { rows: due } = await db.query(
    `SELECT DISTINCT ON (cs.user_id) cs.id, cs.user_id
     FROM checkout_sessions cs
     JOIN users u ON u.id = cs.user_id
     WHERE cs.reminder_sent_at IS NULL
       AND cs.updated_at <  NOW() - make_interval(mins => $1)
       AND cs.updated_at >  NOW() - make_interval(days => $2)
       AND u.email IS NOT NULL AND u.email <> ''
       AND NOT u.cart_reminders_off
       AND NOT COALESCE(u.is_suspended, FALSE)
       AND NOT COALESCE(u.is_admin, FALSE)
       AND (u.cart_reminder_sent_at IS NULL OR u.cart_reminder_sent_at < NOW() - make_interval(days => $3))
       AND NOT EXISTS (
         SELECT 1 FROM (
           SELECT user_id, created_at FROM orders
           UNION ALL SELECT user_id, created_at FROM delivered_orders
           UNION ALL SELECT user_id, created_at FROM cancelled_orders
         ) o WHERE o.user_id = cs.user_id AND o.created_at >= cs.started_at
       )
     ORDER BY cs.user_id, cs.updated_at DESC
     LIMIT $4`,
    [ABANDONED_AFTER_MINUTES, AUTO_WINDOW_DAYS, MIN_DAYS_BETWEEN, limit],
  );

  const couponCode = process.env.CART_REMINDER_COUPON || null;
  const result = { checked: due.length, sent: 0, skipped: 0, failed: 0 };
  for (const row of due) {
    // Claim it first, so two overlapping runs never email twice
    const claim = await db.query(
      'UPDATE checkout_sessions SET reminder_sent_at = NOW() WHERE id = $1 AND reminder_sent_at IS NULL RETURNING id', [row.id],
    );
    if (!claim.rowCount) continue;
    try {
      await sendCartReminder({ userId: row.user_id, sessionId: row.id, couponCode });
      result.sent += 1;
    } catch (error) {
      if (error instanceof CartReminderError) {
        result.skipped += 1;
      } else {
        result.failed += 1;
        console.error(`Cart reminder failed for checkout #${row.id}:`, error);
      }
    }
  }
  return result;
}
