import { NextResponse } from 'next/server';
import db from '../db.js';
import { currentSessionUser } from '../adminAuth.js';
import { ensurePurchasingTables } from './schema.js';
import { hasRole, roleLabel } from './roles.js';

// Errors a purchasing operation reports to the person using it
export class PurchasingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * The signed-in admin's purchasing access, read fresh from the database so a
 * role change applies on the next click: { userId, name, full, roles }.
 * Throws a 401 PurchasingError for anyone who isn't an admin.
 */
export async function purchasingAccess() {
  const sessionUser = await currentSessionUser();
  if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'staff') throw new PurchasingError('Unauthorized', 401);
  await ensurePurchasingTables();

  const { rows: [user] } = await db.query(
    'SELECT id, first_name, last_name, email, is_admin, purchasing_roles FROM users WHERE id = $1',
    [sessionUser.id]
  );
  if (!user?.is_admin) throw new PurchasingError('Unauthorized', 401);
  return {
    userId: user.id,
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
    full: user.purchasing_roles == null,
    roles: user.purchasing_roles || [],
  };
}

/** Throws a 403 unless the user holds `role` (full access holds every role) */
export function requireRole(access, role) {
  if (!hasRole(access, role)) {
    throw new PurchasingError(`You need the ${roleLabel(role)} role to do this. Ask an admin with full access to add it under Purchasing → Team.`, 403);
  }
}

/** For viewing: throws a 403 unless the user holds at least one of `roles` */
export function requireAnyRole(access, roles) {
  if (!roles.some(role => hasRole(access, role))) {
    throw new PurchasingError("You don't have access to this page.", 403);
  }
}

/**
 * Runs a purchasing route handler: it gets the caller's access and returns the
 * JSON body. PurchasingErrors become their own status; anything else is a 500.
 */
export async function handle(fn, { failure = 'Something went wrong. Please try again.' } = {}) {
  try {
    const access = await purchasingAccess();
    const result = await fn(access);
    return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
  } catch (error) {
    if (error instanceof PurchasingError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Purchasing error:', error);
    return NextResponse.json({ message: failure }, { status: 500 });
  }
}

/** Runs `fn(client)` in a transaction */
export async function transaction(fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Shared request-body readers. Each throws a PurchasingError the user can act on.
export const readInt = (value, { min = 0, max = 1_000_000, field = 'Quantity' } = {}) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new PurchasingError(`${field} must be a whole number from ${min} to ${max}.`);
  return n;
};

export const readMoney = (value, { field = 'Amount', allowZero = true } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0) || n > 100_000_000) {
    throw new PurchasingError(`${field} must be ${allowZero ? '0 or more' : 'greater than 0'}.`);
  }
  return n;
};

export const readRate = (value, field = 'Exchange rate') => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 10_000) throw new PurchasingError(`${field} must be greater than 0.`);
  return n;
};

export const readDate = (value, field = 'Date') => {
  if (value == null || value === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value))) {
    throw new PurchasingError(`${field} is not a valid date.`);
  }
  return String(value);
};

export const readText = (value, max = 2000) => {
  const s = String(value ?? '').trim();
  return s ? s.slice(0, max) : null;
};

/** The numeric [id] of a dynamic route */
export async function routeId(params) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) throw new PurchasingError('Not found.', 404);
  return n;
}

/** The JSON body, or {} when there is none */
export async function jsonBody(request) {
  try {
    return (await request.json()) || {};
  } catch {
    return {};
  }
}
