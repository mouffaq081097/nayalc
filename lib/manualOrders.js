import db from './db.js';
import { parsePhone } from './phone.js';
import { calcShipping, getPreorderInfo } from './shipping.js';
import { pointsForOrder } from './loyalty.js';
import { vatFromGross } from './vat.js';
import { calcCouponDiscount } from './couponDiscount.js';
import { ensureCouponProductsColumn } from './couponRules.js';
import { ensureBackorderColumns } from './backorders.js';
import { ensureGuestCheckoutColumns, VISIBLE_ADDRESS_SQL } from './guestCheckout.js';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from './mail.js';
import { isPlaceholderEmail, placeholderEmail, realEmail } from './noEmail.js';

/**
 * Orders the team types in by hand — a customer who calls, messages on
 * WhatsApp or orders in person (Admin → Orders → Create order).
 *
 * The customer is an existing account or a new one (email optional: a phone
 * customer may not have one). Stock follows checkout's rules — shelf first,
 * then pre-order room, never below zero — but prices can be changed per line
 * and delivery can be made free, since the team agrees those on the call.
 * The order is marked `order_source = 'phone'` with an optional internal note.
 */

export const MANUAL_ORDER_METHODS = {
  cashOnDelivery: 'Cash on delivery',
  bankTransfer: 'Bank transfer',
};

export const MANUAL_ORDER_MIGRATION_SQL = `
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
`;

let ready = null;
/** Adds the columns when missing (looks first, so a warm database is never locked). Run BEFORE a BEGIN. */
export function ensureManualOrderColumns() {
  if (!ready) {
    ready = (async () => {
      const { rows } = await db.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'orders' AND column_name IN ('order_source', 'admin_note')`,
      );
      if (rows.length < 2) await db.query(MANUAL_ORDER_MIGRATION_SQL);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export class ManualOrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const round2 = (n) => Math.round(n * 100) / 100;

// ── Finding a customer ─────────────────────────────────────────────────────

/** Up to 8 customers matching an email, name or phone, each with their address book. */
export async function findCustomers(query) {
  const q = clean(query, 120);
  if (q.length < 2) return [];
  await ensureGuestCheckoutColumns();
  const phone = parsePhone(q, { requireMobile: false });
  const { rows: users } = await db.query(
    `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone_number AS phone,
            COALESCE(u.is_suspended, false) AS suspended
     FROM users u
     WHERE LOWER(u.email) LIKE LOWER($1)
        OR LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) LIKE LOWER($1)
        OR ($2::text IS NOT NULL AND (u.phone_number = $2::text
            OR EXISTS (SELECT 1 FROM user_addresses a WHERE a.user_id = u.id AND a.customer_phone = $2::text)))
     ORDER BY u.id DESC
     LIMIT 8`,
    [`%${q.replace(/[%_\\]/g, '\\$&')}%`, phone.ok ? phone.e164 : null],
  );
  if (users.length === 0) return [];
  const { rows: addresses } = await db.query(
    `SELECT id, user_id AS "userId", address_line1 AS line1, address_line2 AS line2, city, country,
            address_label AS label, customer_phone AS phone, is_default AS "isDefault"
     FROM user_addresses
     WHERE user_id = ANY($1::int[]) AND ${VISIBLE_ADDRESS_SQL}
     ORDER BY is_default DESC NULLS LAST, id DESC`,
    [users.map((u) => u.id)],
  );
  return users.map((u) => ({ ...u, email: realEmail(u.email) || null, addresses: addresses.filter((a) => a.userId === u.id) }));
}

// ── Customer and address ───────────────────────────────────────────────────

let emailOptional = null;
async function emailCanBeEmpty() {
  if (emailOptional === null) {
    const { rows } = await db.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'email'`,
    );
    emailOptional = rows[0]?.is_nullable !== 'NO';
  }
  return emailOptional;
}

// Returns the user id: the chosen account, the account with this email/phone, or a new one
async function resolveCustomer(client, customer) {
  if (customer.userId) {
    const { rows: [user] } = await client.query(
      'SELECT id, COALESCE(is_suspended, false) AS suspended FROM users WHERE id = $1', [Number(customer.userId)],
    );
    if (!user) throw new ManualOrderError('That customer no longer exists.');
    if (user.suspended) throw new ManualOrderError('This customer’s account is suspended.');
    return { userId: user.id, created: false };
  }

  const firstName = clean(customer.firstName, 60);
  const lastName = clean(customer.lastName, 60);
  if (!firstName) throw new ManualOrderError('Enter the customer’s first name.');
  const phone = parsePhone(customer.phone);
  if (!phone.ok) throw new ManualOrderError(`Customer phone: ${phone.reason}`);
  const email = clean(customer.email, 254).toLowerCase();
  if (email && !EMAIL_RE.test(email)) throw new ManualOrderError('Enter a valid email address, or leave it empty.');

  // One account per email (or per phone when there's no email)
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`guest-account:${email || phone.e164}`]);
  const { rows: [existing] } = email
    ? await client.query('SELECT id, COALESCE(is_suspended, false) AS suspended FROM users WHERE LOWER(email) = $1 ORDER BY id DESC LIMIT 1', [email])
    : await client.query(
      'SELECT id, COALESCE(is_suspended, false) AS suspended FROM users WHERE phone_number = $1 OR LOWER(email) = $2 ORDER BY id DESC LIMIT 1',
      [phone.e164, placeholderEmail(phone.e164)],
    );
  if (existing?.suspended) throw new ManualOrderError('The account with these details is suspended.');
  if (existing) return { userId: existing.id, created: false };

  const provisional = `u_phone_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const { rows: [user] } = await client.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verified, loyalty_points, phone_number)
     VALUES ($1, $2, NULL, $3, $4, false, 0, $5) RETURNING id`,
    // No email: a placeholder that can never receive mail when the column requires one (lib/noEmail.js)
    [provisional, email || ((await emailCanBeEmpty()) ? null : placeholderEmail(phone.e164)), firstName, lastName, phone.e164],
  );
  const handle = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'member'}${user.id}`;
  await client.query('SAVEPOINT handle');
  try {
    await client.query('UPDATE users SET username = $1 WHERE id = $2', [handle, user.id]);
  } catch {
    await client.query('ROLLBACK TO SAVEPOINT handle'); // the provisional handle is already valid
  }
  return { userId: user.id, created: true };
}

async function resolveAddress(client, userId, address, fallback) {
  if (address.addressId) {
    const { rows: [row] } = await client.query(
      'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2', [Number(address.addressId), userId],
    );
    if (!row) throw new ManualOrderError('That address doesn’t belong to this customer.');
    return row.id;
  }

  const line1 = clean(address.line1);
  const city = clean(address.city, 100);
  if (!line1) throw new ManualOrderError('Enter the delivery street address.');
  if (!city) throw new ManualOrderError('Choose the emirate.');
  let fallbackPhone = fallback.phone;
  if (!address.phone && !fallbackPhone) {
    const { rows: [user] } = await client.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    fallbackPhone = user?.phone_number;
  }
  const phone = parsePhone(address.phone || fallbackPhone);
  if (!phone.ok) throw new ManualOrderError(`Delivery phone: ${phone.reason}`);
  const recipient = clean(address.label, 80) || [fallback.firstName, fallback.lastName].map((s) => clean(s, 60)).filter(Boolean).join(' ') || line1;

  const { rows: [{ count }] } = await client.query(
    `SELECT COUNT(*)::int AS count FROM user_addresses WHERE user_id = $1 AND ${VISIBLE_ADDRESS_SQL}`, [userId],
  );
  const { rows: [row] } = await client.query(
    `INSERT INTO user_addresses
       (user_id, shipping_address, address_line1, address_line2, city, zip_code, country, state, is_default, address_label, customer_phone)
     VALUES ($1, $2::text, $2::text, $3, $4, '0000', 'United Arab Emirates', '', $5, $6, $7) -- $2 fills two columns of different types (text / varchar); cast it once so Postgres doesn't refuse
     RETURNING id`,
    [userId, line1, clean(address.line2) || null, city, count === 0, recipient, phone.e164],
  );
  return row.id;
}

// ── Creating the order ─────────────────────────────────────────────────────

/**
 * input: {
 *   customer: { userId } | { firstName, lastName, email?, phone },
 *   address:  { addressId } | { line1, line2?, city, phone?, label? },
 *   items: [{ productId, quantity, price }],   // price = agreed unit price, VAT included
 *   paymentMethod: 'cashOnDelivery' | 'bankTransfer', paymentReceived?,
 *   couponCode?, freeShipping?, note?, sendEmail?
 * }
 * Returns { orderId, userId, customerCreated, total, emailSent }.
 */
export async function createManualOrder(input = {}) {
  const { customer = {}, address = {}, paymentMethod, couponCode, note } = input;
  const items = Array.isArray(input.items) ? input.items.map((i) => ({
    productId: Number(i.productId), quantity: Number(i.quantity), price: round2(Number(i.price)),
  })) : [];

  if (!MANUAL_ORDER_METHODS[paymentMethod]) throw new ManualOrderError('Choose how the customer pays.');
  if (items.length === 0) throw new ManualOrderError('Add at least one product.');
  if (items.some((i) => !Number.isInteger(i.productId) || !Number.isInteger(i.quantity) || i.quantity < 1 || !(i.price >= 0))) {
    throw new ManualOrderError('Every product needs a quantity of 1 or more and a price.');
  }
  if (new Set(items.map((i) => i.productId)).size !== items.length) {
    throw new ManualOrderError('A product is listed twice — change its quantity instead.');
  }
  const paid = paymentMethod === 'bankTransfer' && !!input.paymentReceived;

  // Schema changes first: adding a column locks the table
  await Promise.all([ensureManualOrderColumns(), ensureBackorderColumns(), ensureGuestCheckoutColumns(), ensureCouponProductsColumn(db)]);

  const client = await db.connect();
  let orderId, userId, customerCreated, totals, preorder, couponRow, addressId;
  const plan = {};
  try {
    await client.query('BEGIN');

    ({ userId, created: customerCreated } = await resolveCustomer(client, customer));
    addressId = await resolveAddress(client, userId, address, customer);

    // Stock, locked lowest id first like placeOrder() and allocateStock()
    let leadDays = 0;
    for (const item of [...items].sort((a, b) => a.productId - b.productId)) {
      const { rows: [product] } = await client.query(
        `SELECT p.name, p.stock_quantity, p.allow_backorder, p.backorder_lead_days, p.backorder_limit,
                COALESCE((SELECT SUM(oi.backordered_qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS owed
         FROM products p WHERE p.id = $1 FOR UPDATE`,
        [item.productId],
      );
      if (!product) throw new ManualOrderError(`Product #${item.productId} doesn’t exist.`);
      const shelf = Math.max(0, Number(product.stock_quantity) || 0);
      const short = Math.max(0, item.quantity - shelf);
      if (short > 0) {
        const room = product.allow_backorder ? Math.max(0, Number(product.backorder_limit) - product.owed) : 0;
        if (short > room) {
          const canOrder = shelf + room;
          throw new ManualOrderError(canOrder > 0
            ? `Only ${canOrder} of "${product.name}" can be ordered right now.`
            : `"${product.name}" is out of stock.`);
        }
        if (paymentMethod === 'cashOnDelivery') {
          throw new ManualOrderError(`"${product.name}" would be a pre-order, and cash on delivery isn’t allowed for pre-orders. Lower the quantity or take a bank transfer.`);
        }
        leadDays = Math.max(leadDays, Number(product.backorder_lead_days) || 1);
      }
      plan[item.productId] = { fromShelf: item.quantity - short, short, name: product.name };
    }
    preorder = leadDays > 0 ? getPreorderInfo(leadDays) : null;

    // Discount code: checked like checkout (active, not expired, under its limit)
    let discount = 0;
    if (clean(couponCode)) {
      const { rows: [coupon] } = await client.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [clean(couponCode)]);
      if (!coupon) throw new ManualOrderError(`There’s no discount code "${clean(couponCode)}".`);
      if (!coupon.is_active) throw new ManualOrderError(`${coupon.code} is switched off.`);
      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) throw new ManualOrderError(`${coupon.code} has expired.`);
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) throw new ManualOrderError(`${coupon.code} has been used up.`);
      discount = calcCouponDiscount(coupon, items);
      if (discount <= 0) throw new ManualOrderError(`${coupon.code} doesn’t take anything off these products (check its minimum or the products it applies to).`);
      couponRow = coupon;
    }

    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const shipping = input.freeShipping ? 0 : calcShipping(items.reduce((s, i) => s + i.quantity, 0));
    const total = Math.max(0, round2(subtotal + shipping - discount));
    totals = { subtotal, shipping, discount, total, tax: vatFromGross(total) };

    const { rows: [order] } = await client.query(
      `INSERT INTO orders
         (user_address_id, payment_method, total_amount, tax_amount, subtotal, shipping_cost, gift_wrap, gift_wrap_cost,
          discount_amount, applied_coupon_id, order_status, payment_confirmed, user_id, shipping_scheduled_date,
          redeemed_points, awaiting_stock, promised_ship_by, order_source, admin_note)
       VALUES ($1, $2, $3, $4, $5, $6, false, 0, $7, $8, 'Pending', $9, $10, NOW() + INTERVAL '3 days',
               0, $11, $12, 'phone', $13)
       RETURNING id`,
      [addressId, paymentMethod, total, totals.tax, subtotal, shipping, discount, couponRow?.id ?? null,
       paid, userId, !!preorder, preorder ? preorder.shipByISO : null, clean(note, 2000) || null],
    );
    orderId = order.id;

    for (const item of items) {
      const { fromShelf, short } = plan[item.productId];
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, backordered_qty) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.productId, item.quantity, item.price, short],
      );
      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [fromShelf, item.productId]);
    }
    if (couponRow) await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [couponRow.id]);

    // Points are credited on delivery, as for any order
    const { rows: [tier] } = await client.query('SELECT loyalty_tier FROM users WHERE id = $1', [userId]);
    await client.query(
      'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'pending', pointsForOrder(subtotal, tier?.loyalty_tier || 'Silver'), `Order #${orderId} placed — points credited on delivery`, orderId],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  // Emails never undo the order
  let emailSent = false;
  let emailError = null;
  try {
    const [{ rows: [user] }, { rows: [addr] }, { rows: products }] = await Promise.all([
      db.query('SELECT email, first_name FROM users WHERE id = $1', [userId]),
      db.query('SELECT shipping_address, city, zip_code, country, customer_phone FROM user_addresses WHERE id = $1', [addressId]),
      db.query(
        'SELECT p.id, p.name, pi.image_url FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE WHERE p.id = ANY($1::int[])',
        [items.map((i) => i.productId)],
      ),
    ]);
    const shippingAddress = {
      street: addr?.shipping_address || '', city: addr?.city || '', zip: addr?.zip_code || '',
      country: addr?.country || 'United Arab Emirates', state: '',
    };
    const detailed = items.map((item) => {
      const p = products.find((row) => row.id === item.productId);
      const { short } = plan[item.productId];
      const note = short > 0 && preorder
        ? `${short === item.quantity ? 'Pre-order' : `${short} of ${item.quantity} on pre-order`} · ships by ${preorder.shipByLabel}`
        : '';
      return { ...item, name: p?.name || 'Product', imageUrl: p?.image_url || '', note };
    });
    const placedAt = new Date();

    if (input.sendEmail && user?.email && !isPlaceholderEmail(user.email)) {
      const result = await sendOrderConfirmationEmail(
        user.email, user.first_name || 'Customer', orderId, totals.total, totals.tax, totals.discount, totals.subtotal,
        totals.shipping, detailed, shippingAddress, 0, couponRow?.code ?? null, paymentMethod, placedAt,
        preorder?.shipByLabel || null, null,
      );
      emailSent = result?.success !== false;
      if (!emailSent) emailError = result?.error || 'The confirmation email could not be sent.';
    }
    await sendAdminNotificationEmail(null, orderId, realEmail(user?.email) || 'No email (phone order)', totals.total, shippingAddress, {
      customerName: user?.first_name,
      customerPhone: addr?.customer_phone,
      paymentMethod,
      items: detailed,
      subtotal: totals.subtotal,
      shippingCost: totals.shipping,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      giftWrapCost: 0,
      couponCode: couponRow?.code ?? null,
      placedAt,
      preorderShipBy: preorder?.shipByLabel || null,
    }).catch((e) => console.error(`Admin notification failed for manual order #${orderId}:`, e));
  } catch (error) {
    console.error(`Emails failed for manual order #${orderId}:`, error);
    if (input.sendEmail) emailError = error.message;
  }

  return { orderId, userId, customerCreated, total: totals.total, emailSent, emailError };
}
