import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed links for the review request email. The token lets the customer who
 * bought a product review it straight from the email, without signing in
 * first: it names the customer and the product, and expires.
 *
 * Format: base64url("userId.productId.expiresAtSeconds") + "." + HMAC-SHA256.
 */

const TTL_DAYS = 60;

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error('NEXTAUTH_SECRET is not set');
  return value;
}

const sign = (payload) => createHmac('sha256', secret()).update(`review:${payload}`).digest('base64url');

export function createReviewToken(userId, productId, { ttlDays = TTL_DAYS, now = Date.now() } = {}) {
  const expires = Math.floor(now / 1000) + ttlDays * 86400;
  const payload = Buffer.from(`${Number(userId)}.${Number(productId)}.${expires}`).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** The customer and product a token was issued for, or null when it's forged, mangled or expired. */
export function readReviewToken(token, { now = Date.now() } = {}) {
  if (typeof token !== 'string' || token.length > 300) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const [userId, productId, expires] = Buffer.from(payload, 'base64url').toString().split('.').map(Number);
  if (!Number.isInteger(userId) || !Number.isInteger(productId) || !Number.isInteger(expires)) return null;
  if (expires * 1000 < now) return null;
  return { userId, productId };
}
