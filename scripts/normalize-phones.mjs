/**
 * Rewrites every phone number already in the database into the canonical
 * E.164 shape that lib/phone.js now enforces on the way in.
 *
 * Until now nothing normalised phone numbers, so the same customer could be
 * stored as "0501234567" in one row, "+971 50 123 4567" in another and
 * "+9710501234567" in a third. That is what makes the admin tel: and WhatsApp
 * links open the wrong number, and what makes a phone search miss.
 *
 * Rows are sorted into three buckets:
 *   changed   - parsed cleanly, will be rewritten
 *   already   - already canonical, left alone
 *   unparsed  - cannot be read as a UAE number; left exactly as they are and
 *               listed so you can decide what to do, because guessing at a
 *               customer's phone number is worse than leaving it visibly odd
 *
 *   node scripts/normalize-phones.mjs             dry run, prints the plan
 *   node scripts/normalize-phones.mjs --apply     writes
 *   node scripts/normalize-phones.mjs --apply --include-landlines
 *
 * Landlines are skipped by default: a delivery contact that cannot take an SMS
 * is not much use, so they are reported rather than silently blessed. Pass
 * --include-landlines to canonicalise those too.
 *
 * Idempotent — a second run finds nothing to do. Must be run from the project
 * root so @vercel/postgres resolves.
 */
import fs from 'node:fs';
import { parsePhone } from '../lib/phone.js';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}

const apply = process.argv.includes('--apply');
const includeLandlines = process.argv.includes('--include-landlines');

// Every column that holds a phone number, and the primary key to write back by.
const TARGETS = [
  { table: 'users', key: 'id', column: 'phone_number' },
  { table: 'user_addresses', key: 'id', column: 'customer_phone' },
];

const { createPool } = await import('@vercel/postgres');
const db = createPool();

const exists = async (table, column) => {
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`, [table, column]);
  return rows.length > 0;
};

const plan = [];
const summary = [];
const unparsed = [];

for (const t of TARGETS) {
  if (!(await exists(t.table, t.column))) {
    summary.push({ table: t.table, column: t.column, status: 'column missing — skipped' });
    continue;
  }

  const { rows } = await db.query(
    `SELECT ${t.key} AS key, ${t.column} AS phone
     FROM ${t.table}
     WHERE ${t.column} IS NOT NULL AND btrim(${t.column}) <> ''`);

  let changed = 0, already = 0, skipped = 0;

  for (const row of rows) {
    const parsed = parsePhone(row.phone, { requireMobile: false });

    if (!parsed.ok) {
      skipped++;
      unparsed.push({ table: t.table, key: row.key, stored: row.phone, reason: parsed.reason });
      continue;
    }
    if (parsed.type === 'landline' && !includeLandlines) {
      skipped++;
      unparsed.push({ table: t.table, key: row.key, stored: row.phone, reason: `landline (${parsed.region}) — pass --include-landlines` });
      continue;
    }
    if (parsed.e164 === row.phone) { already++; continue; }

    changed++;
    plan.push({ ...t, key: row.key, from: row.phone, to: parsed.e164 });
  }

  summary.push({ table: t.table, column: t.column, rows: rows.length, changed, already_canonical: already, needs_review: skipped });
}

console.table(summary);

if (plan.length) {
  console.log(`\n${plan.length} row(s) to rewrite — first 25:`);
  console.table(plan.slice(0, 25).map(p => ({ table: p.table, id: p.key, from: p.from, to: p.to })));
}

if (unparsed.length) {
  console.log(`\n${unparsed.length} row(s) left untouched for review — first 25:`);
  console.table(unparsed.slice(0, 25));
}

if (plan.length === 0) {
  console.log('\nEvery readable phone number is already canonical — nothing to do.');
  process.exit(0);
}

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply to commit.');
  process.exit(0);
}

const client = await db.connect();
try {
  await client.query('BEGIN');
  for (const p of plan) {
    await client.query(
      `UPDATE ${p.table} SET ${p.column} = $1 WHERE ${p.key} = $2`,
      [p.to, p.key]);
  }
  await client.query('COMMIT');
  console.log(`\nDone. ${plan.length} phone number(s) normalised to E.164.`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Rolled back — nothing changed.', e);
  process.exit(1);
} finally {
  client.release();
}
process.exit(0);
