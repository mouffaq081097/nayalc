import { createHash, randomInt, timingSafeEqual } from 'crypto';
import db from './db.js';

// Shopify-style sign-in: the customer types their email, we send a 6-digit code,
// and the code signs them in (creating the account the first time). One live
// code per email; it expires after CODE_TTL_MINUTES and locks after MAX_ATTEMPTS
// wrong tries, so a code can't be guessed. Only a hash of the code is stored.

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

let ready = null;
export function ensureLoginCodesTable() {
  ready ??= db.query(`
    CREATE TABLE IF NOT EXISTS email_login_codes (
      email      TEXT PRIMARY KEY,
      code_hash  TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts   INTEGER NOT NULL DEFAULT 0,
      marketing  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(error => { ready = null; throw error; });
  return ready;
}

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashCode = (email, code) =>
  createHash('sha256').update(`${email}:${code}:${process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''}`).digest('hex');

/** A new code for this email (replacing any earlier one). Returns the plain code to email. */
export async function createLoginCode(email, { marketing = false } = {}) {
  await ensureLoginCodesTable();
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.query(`
    INSERT INTO email_login_codes (email, code_hash, expires_at, attempts, marketing, created_at)
    VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, 0, $4, NOW())
    ON CONFLICT (email) DO UPDATE
      SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at,
          attempts = 0, marketing = EXCLUDED.marketing, created_at = NOW()
  `, [email, hashCode(email, code), String(CODE_TTL_MINUTES), Boolean(marketing)]);
  return code;
}

/**
 * Checks a code once. { ok: true, marketing } uses it up; otherwise
 * { ok: false, reason: 'wrong' | 'expired' | 'locked' }.
 */
export async function verifyLoginCode(email, code) {
  await ensureLoginCodesTable();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: [row] } = await client.query(
      'SELECT code_hash, expires_at, attempts, marketing FROM email_login_codes WHERE email = $1 FOR UPDATE', [email]
    );
    let result;
    if (!row || new Date(row.expires_at) < new Date()) {
      if (row) await client.query('DELETE FROM email_login_codes WHERE email = $1', [email]);
      result = { ok: false, reason: 'expired' };
    } else if (row.attempts >= MAX_ATTEMPTS) {
      result = { ok: false, reason: 'locked' };
    } else {
      const given = Buffer.from(hashCode(email, String(code || '').replace(/\D/g, '')), 'hex');
      const stored = Buffer.from(row.code_hash, 'hex');
      if (given.length === stored.length && timingSafeEqual(given, stored)) {
        await client.query('DELETE FROM email_login_codes WHERE email = $1', [email]);
        result = { ok: true, marketing: row.marketing };
      } else {
        await client.query('UPDATE email_login_codes SET attempts = attempts + 1 WHERE email = $1', [email]);
        result = { ok: false, reason: row.attempts + 1 >= MAX_ATTEMPTS ? 'locked' : 'wrong' };
      }
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// "layla.haddad92@…" -> "Layla"; the customer can change it on their profile
function nameFromEmail(email) {
  const word = email.split('@')[0].split(/[._\-+0-9]+/).find(Boolean) || 'there';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The account for this email, created on the first code sign-in. A correct code
 * proves the address, so it is marked verified. Returns { user, created }.
 */
export async function findOrCreateUserByEmail(email, columns) {
  const client = await db.connect();
  try {
    const { rows: [existing] } = await client.query(
      `SELECT ${columns} FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1`, [email]
    );
    if (existing) {
      if (existing.email_verified === false) {
        await client.query('UPDATE users SET email_verified = true WHERE id = $1', [existing.id]);
        existing.email_verified = true;
      }
      return { user: existing, created: false };
    }
    const firstName = nameFromEmail(email);
    const provisional = `u_code_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const { rows: [user] } = await client.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verified, loyalty_points)
       VALUES ($1, $2, NULL, $3, '', true, 0)
       RETURNING ${columns}`,
      [provisional, email, firstName]
    );
    const handle = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'member'}${user.id}`;
    try {
      await client.query('UPDATE users SET username = $1 WHERE id = $2', [handle, user.id]);
      user.username = handle;
    } catch {
      // The provisional handle is already valid
    }
    return { user, created: true };
  } finally {
    client.release();
  }
}
