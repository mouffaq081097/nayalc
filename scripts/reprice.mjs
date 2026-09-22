/**
 * One-time repricing — bakes the card processing cost into product prices.
 *
 * Prices go up uniformly for every payment method, so this is a price change,
 * not a surcharge: nothing extra is added at checkout, no line item appears,
 * and card, cash-on-delivery and Tabby customers all pay the same figure.
 *
 * `comparedprice` is scaled by the same factor so every "was" price keeps the
 * discount percentage it advertised before.
 *
 *   node scripts/reprice.mjs                     dry run, 3%, rounded to whole AED
 *   node scripts/reprice.mjs --rate=4            dry run at 4%
 *   node scripts/reprice.mjs --round=exact       keep two decimals instead
 *   node scripts/reprice.mjs --rate=3 --apply    writes, after taking a backup
 *   node scripts/reprice.mjs --revert=<file>     restores a backup
 *
 * Must be run from the project root so @vercel/postgres resolves.
 */
import fs from 'node:fs';
import path from 'node:path';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}

const args   = process.argv.slice(2);
const flag   = (name) => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1];
const apply  = args.includes('--apply');
const revert = flag('revert');
const rate   = Number(flag('rate') ?? 3);

if (!revert && !(rate > 0 && rate < 100)) {
  console.error(`Refusing to run: --rate=${rate} is not a sane percentage.`);
  process.exit(1);
}

const { createPool } = await import('@vercel/postgres');
const db = createPool();

const money = (v) => Number(v == null ? 0 : v);

// How the marked-up figure is tidied. The catalogue is mostly round numbers,
// and a raw 3% turns 250 into 257.50, so `whole` is usually what you want.
//   exact  250 -> 257.50   keeps two decimals
//   whole  250 -> 258      nearest AED
//   five   250 -> 260      nearest 5 AED, always up
const ROUNDING = {
  exact: (v) => Math.round(v * 100) / 100,
  whole: (v) => Math.round(v),
  five:  (v) => Math.ceil(v / 5) * 5,
};
const mode = flag('round') ?? 'whole';
if (!ROUNDING[mode]) {
  console.error(`Unknown --round=${mode}. Use exact, whole or five.`);
  process.exit(1);
}
const marked = (v) => ROUNDING[mode](money(v) * (1 + rate / 100));

if (revert) {
  const backup = JSON.parse(fs.readFileSync(revert, 'utf8'));
  console.log(`Restoring ${backup.rows.length} products from ${revert} (taken ${backup.takenAt})`);
  for (const r of backup.rows) {
    await db.query('UPDATE products SET price = $1, comparedprice = $2 WHERE id = $3',
      [r.price, r.comparedprice, r.id]);
  }
  console.log('Reverted.');
  process.exit(0);
}

const { rows } = await db.query(
  'SELECT id, name, price, comparedprice FROM products ORDER BY id');

console.table(rows.map(r => ({
  id: r.id,
  name: String(r.name).slice(0, 34),
  price: money(r.price).toFixed(2),
  newPrice: marked(r.price).toFixed(2),
  compared: r.comparedprice == null ? '-' : money(r.comparedprice).toFixed(2),
  newCompared: r.comparedprice == null ? '-' : marked(r.comparedprice).toFixed(2),
})));

const oldSum = rows.reduce((s, r) => s + money(r.price), 0);
const newSum = rows.reduce((s, r) => s + marked(r.price), 0);
const effective = ((newSum / oldSum) - 1) * 100;

console.log(`products        : ${rows.length}`);
console.log(`rounding        : --round=${mode}`);
console.log(`markup          : ${rate}% nominal, ${effective.toFixed(2)}% effective after rounding`);
console.log(`catalogue value : AED ${oldSum.toFixed(2)} -> AED ${newSum.toFixed(2)}  (+AED ${(newSum - oldSum).toFixed(2)})`);
console.log(`comparedprice   : ${rows.filter(r => r.comparedprice != null).length} of ${rows.length} rows also scaled`);

if (!apply) {
  console.log('DRY RUN — nothing written. Re-run with --apply to commit.');
  process.exit(0);
}

const stamp  = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join('scripts', `price-backup-${stamp}.json`);
fs.writeFileSync(backup, JSON.stringify({
  takenAt: new Date().toISOString(),
  rate,
  mode,
  rows: rows.map(r => ({ id: r.id, price: r.price, comparedprice: r.comparedprice })),
}, null, 2));
console.log(`Backup written to ${backup}`);

const client = await db.connect();
try {
  await client.query('BEGIN');
  for (const r of rows) {
    await client.query(
      'UPDATE products SET price = $1, comparedprice = $2 WHERE id = $3',
      [marked(r.price), r.comparedprice == null ? null : marked(r.comparedprice), r.id]);
  }
  await client.query('COMMIT');
  console.log(`Repriced ${rows.length} products at +${rate}% (--round=${mode}).`);
  console.log(`Revert with: node scripts/reprice.mjs --revert=${backup}`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Rolled back — nothing changed.', e);
  process.exit(1);
} finally {
  client.release();
}
process.exit(0);
