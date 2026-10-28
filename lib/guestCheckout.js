import { createHmac, timingSafeEqual } from 'node:crypto';
import db from './db.js';
import { parsePhone } from './phone.js';
import { sendSubscriptionConfirmationEmail } from './mail.js';

/**
 * Checkout without signing in. The shopper gives an email, a name, a phone and
 * an address; startGuestCheckout() files them under an account so the order
 * works like any other (emails, My orders, points on delivery):
 *
 * - a new email gets a new account (not verified: the first code sign-in proves it);
 * - an email that already has an account gets the order on that account, but the
 *   address is marked `from_guest_checkout` and stays out of its address book,
 *   so typing someone else's email can't add to or read their account.
 *
 * It returns a short-lived signed checkout token naming that account and
 * address; the guest order routes accept it instead of a session. After the
 * order, a longer-lived order link token opens the confirmation page.
 */

export const GUEST_CHECKOUT_MIGRATION_SQL = `
  ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS from_guest_checkout BOOLEAN NOT NULL DEFAULT FALSE;
`;

let ensured = false;
export async function ensureGuestCheckoutColumns() {
  if (ensured) return;
  await db.query(GUEST_CHECKOUT_MIGRATION_SQL);
  ensured = true;
}

// SQL condition for address book listings: guest-checkout addresses on an
// existing account are hidden. Read through to_jsonb so it works before the column exists.
export const VISIBLE_ADDRESS_SQL = `NOT COALESCE((to_jsonb(user_addresses) ->> 'from_guest_checkout')::boolean, FALSE)`;

// ── Signed tokens ──────────────────────────────────────────────────────────

const CHECKOUT_TTL_SECONDS = 3 * 3600;       // long enough to pay, including a Tabby detour
const ORDER_LINK_TTL_SECONDS = 30 * 86400;   // the confirmation page link

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error('NEXTAUTH_SECRET is not set');
  return value;
}

const signature = (purpose, payload) => createHmac('sha256', secret()).update(`${purpose}:${payload}`).digest('base64url');

function sign(purpose, data, ttlSeconds) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  return `${payload}.${signature(purpose, payload)}`;
}

function read(purpose, token) {
  if (typeof token !== 'string' || token.length > 600) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(signature(purpose, payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Names the account and address a guest checkout uses. */
export const createCheckoutToken = ({ userId, addressId }) => sign('guest-checkout', { u: Number(userId), a: Number(addressId) }, CHECKOUT_TTL_SECONDS);

export function readCheckoutToken(token) {
  const data = read('guest-checkout', token);
  return data && Number.isInteger(data.u) && Number.isInteger(data.a) ? { userId: data.u, addressId: data.a } : null;
}

/** Opens one order's confirmation page without signing in. */
export const createOrderLinkToken = ({ orderId, userId }) => sign('guest-order', { o: Number(orderId), u: Number(userId) }, ORDER_LINK_TTL_SECONDS);

export function readOrderLinkToken(token, orderId) {
  const data = read('guest-order', token);
  return data && Number(data.o) === Number(orderId) ? { orderId: data.o, userId: data.u } : null;
}

// ── Starting a guest checkout ─────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);

export class GuestCheckoutError extends Error {
  constructor(message, field = null) {
    super(message);
    this.field = field;
  }
}

function nameFromEmail(email) {
  const word = email.split('@')[0].split(/[._\-+0-9]+/).find(Boolean) || 'there';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Validates the guest's details, files them under an account and returns
 * { token, created } (created: a new account was made for this email).
 */
export async function startGuestCheckout(input = {}) {
  const email = clean(input.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new GuestCheckoutError('Enter a valid email address.', 'email');

  const firstName = clean(input.firstName, 60);
  const lastName = clean(input.lastName, 60);
  if (!firstName) throw new GuestCheckoutError('Enter your first name.', 'firstName');

  const phone = parsePhone(input.phone);
  if (!phone.ok) throw new GuestCheckoutError(phone.reason, 'phone');

  const address = input.address || {};
  const line1 = clean(address.address_line1);
  const city = clean(address.city, 100);
  if (!line1) throw new GuestCheckoutError('Enter your street address.', 'address');
  if (!city) throw new GuestCheckoutError('Choose your emirate or city.', 'address');

  await ensureGuestCheckoutColumns();
  const client = await db.connect();
  let created = false;
  let userId;
  let addressId;
  try {
    await client.query('BEGIN');
    // One account per email; two guest checkouts at once must not create two
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`guest-account:${email}`]);

    const { rows: [existing] } = await client.query(
      'SELECT id, COALESCE(is_suspended, false) AS is_suspended FROM users WHERE LOWER(email) = $1 ORDER BY id DESC LIMIT 1',
      [email],
    );
    if (existing?.is_suspended) throw new GuestCheckoutError('This email can’t be used to order. Please contact us.', 'email');

    if (existing) {
      userId = existing.id;
    } else {
      const provisional = `u_guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const { rows: [user] } = await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verified, loyalty_points, phone_number)
         VALUES ($1, $2, NULL, $3, $4, false, 0, $5)
         RETURNING id`,
        [provisional, email, firstName || nameFromEmail(email), lastName, phone.e164],
      );
      userId = user.id;
      created = true;
      const handle = `${(firstName || nameFromEmail(email)).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'member'}${userId}`;
      await client.query('SAVEPOINT handle');
      try {
        await client.query('UPDATE users SET username = $1 WHERE id = $2', [handle, userId]);
      } catch {
        await client.query('ROLLBACK TO SAVEPOINT handle'); // the provisional handle is already valid
      }
    }

    const recipient = [firstName, lastName].filter(Boolean).join(' ');
    const { rows: [row] } = await client.query(
      `INSERT INTO user_addresses
         (user_id, shipping_address, address_line1, address_line2, city, zip_code, country, state,
          is_default, address_label, customer_phone, from_guest_checkout)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        userId, line1, clean(address.address_line2) || null, city, clean(address.zip_code, 20) || '0000',
        clean(address.country, 80) || 'United Arab Emirates', clean(address.state, 80),
        created, recipient || clean(address.address_label, 80) || line1, phone.e164,
        !created,
      ],
    );
    addressId = row.id;
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  // "Email me with news and offers" on a new account: the same welcome as the footer sign-up
  if (created && input.newsletter) {
    sendSubscriptionConfirmationEmail(email).catch((e) => console.error('Welcome offer email failed:', e));
  }

  return { token: createCheckoutToken({ userId, addressId }), created };
}
