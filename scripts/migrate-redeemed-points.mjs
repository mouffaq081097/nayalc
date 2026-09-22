/**
 * Adds `redeemed_points` to the two archive tables.
 *
 * Two bugs share one cause. The cancel path inserts `redeemed_points` into
 * `cancelled_orders`, which has no such column, so every cancellation throws
 * `column "redeemed_points" does not exist` and rolls back. The delivered path
 * omits the column altogether, so a member's points redemption is lost the
 * moment their order is archived — and the loyalty line on the order summary
 * disappears with it, leaving the totals unable to reconcile again.
 *
 * Purely additive: a nullable integer defaulting to 0, guarded by
 * IF NOT EXISTS, so re-running it is harmless.
 *
 *   node scripts/migrate-redeemed-points.mjs            dry run
 *   node scripts/migrate-redeemed-points.mjs --apply    writes
 *
 * Reverse with: ALTER TABLE <table> DROP COLUMN redeemed_points;
 *
 * Must be run from the project root so @vercel/postgres resolves.
 */
import fs from 'node:fs';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}

const apply  = process.argv.includes('--apply');
const TABLES = ['cancelled_orders', 'delivered_orders'];

// The archive tables were built with narrower types than `orders`, so money
// columns that hold decimals there could not be archived at all: a subtotal of
// 520.00 hits `invalid input syntax for type integer` and the whole delivery
// or cancellation rolls back. Widening to numeric is lossless.
const COLUMN_TYPES = [
  { table: 'cancelled_orders', column: 'subtotal',       want: 'numeric' },
  { table: 'cancelled_orders', column: 'shipping_cost',  want: 'numeric' },
  { table: 'delivered_orders', column: 'subtotal',       want: 'numeric' },
  { table: 'delivered_orders', column: 'shipping_cost',  want: 'numeric' },
  { table: 'delivered_orders', column: 'gift_wrap_cost', want: 'numeric' },
];

const { createPool } = await import('@vercel/postgres');
const db = createPool();

const present = async (table) => {
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = 'redeemed_points'`, [table]);
  return rows.length > 0;
};

const state = [];
for (const t of TABLES) {
  const { rows: [{ count }] } = await db.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
  state.push({ table: t, rows: count, has_redeemed_points: await present(t) });
}
console.table(state);

const todo = state.filter(s => !s.has_redeemed_points).map(s => s.table);

const typeOf = async (table, column) => {
  const { rows } = await db.query(
    `SELECT data_type FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`, [table, column]);
  return rows[0]?.data_type ?? null;
};

const retype = [];
for (const c of COLUMN_TYPES) {
  const is = await typeOf(c.table, c.column);
  if (is && is !== c.want) retype.push({ ...c, is });
}
if (retype.length) console.table(retype.map(r => ({ table: r.table, column: r.column, from: r.is, to: r.want })));

if (todo.length === 0 && retype.length === 0) {
  console.log('Schema already correct — nothing to do.');
  process.exit(0);
}
if (todo.length) console.log(`Will add redeemed_points to: ${todo.join(', ')}`);
if (retype.length) console.log(`Will widen ${retype.length} column(s) to numeric`);

if (!apply) {
  console.log('DRY RUN — nothing written. Re-run with --apply to commit.');
  process.exit(0);
}

const client = await db.connect();
try {
  await client.query('BEGIN');
  for (const t of todo) {
    await client.query(
      `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0`);
    console.log(`  ${t}: redeemed_points added`);
  }
  for (const c of retype) {
    // USING handles the text -> numeric case; empty strings become NULL rather
    // than aborting the migration.
    await client.query(
      `ALTER TABLE ${c.table} ALTER COLUMN ${c.column} TYPE numeric
       USING NULLIF(${c.column}::text, '')::numeric`);
    console.log(`  ${c.table}.${c.column}: ${c.is} -> numeric`);
  }
  await client.query('COMMIT');
  console.log('Done. Cancellation and delivery archiving both work, decimals included.');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Rolled back — nothing changed.', e);
  process.exit(1);
} finally {
  client.release();
}
process.exit(0);
