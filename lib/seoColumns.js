import db from './db.js';

/**
 * Admin → SEO: each product's own search listing (seo_title, seo_description) and
 * Google Merchant category (google_category_id, lib/googleTaxonomy.js), each
 * collection's Google category, and alt text for every image the store shows.
 * Added on first use by ensureSeoColumns(), and by migration 022.
 */
const COLUMNS = [
  ['products', 'seo_title', 'TEXT'],
  ['products', 'seo_description', 'TEXT'],
  ['products', 'google_category_id', 'INTEGER'],
  ['categories', 'google_category_id', 'INTEGER'],
  ['categories', 'image_alt', 'TEXT'],
  ['brands', 'image_alt', 'TEXT'],
  ['hero_slides', 'image_alt', 'TEXT'],
  ['homepage_campaigns', 'image_alt', 'TEXT'],
  ['journal_articles', 'cover_image_alt', 'TEXT'],
  ['social_posts', 'image_alt', 'TEXT'],
];

// Zorah Sublime's search listing used to be written into the product page's code; it moves into the product
const ZORAH_LISTING_SQL = `
  UPDATE products
     SET seo_title = 'Zorah Sublime Night Cream 50ml, Pure Argan Oil | Buy in UAE | Naya Lumière Cosmetics',
         seo_description = 'Zorah Sublime Night Cream 50ml with Pure Argan Oil, Enhanced Skin Hydration, Revitalizing & Brightening, Vegan, Cruelty-Free, Ideal for All Skin Types. Buy in UAE.'
   WHERE name ILIKE '%zorah sublime%' AND seo_title IS NULL AND seo_description IS NULL;
`;

// A table created later by its own code gets the column from its CREATE TABLE
export const SEO_MIGRATION_SQL = `${COLUMNS
  .map(([table, column, type]) => `ALTER TABLE IF EXISTS ${table} ADD COLUMN IF NOT EXISTS ${column} ${type};`)
  .join('\n')}
${ZORAH_LISTING_SQL}`;

let ready = null;

/**
 * Adds whichever columns are missing. It looks first, so a warm database is
 * never locked by an ALTER TABLE. Run it BEFORE a transaction's BEGIN.
 */
export function ensureSeoColumns() {
  if (!ready) {
    ready = (async () => {
      const tables = [...new Set(COLUMNS.map(([t]) => t))];
      const [{ rows: haveTables }, { rows: haveColumns }] = await Promise.all([
        db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1)', [tables]),
        db.query('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ANY($1)', [tables]),
      ]);
      const existing = new Set(haveTables.map((r) => r.table_name));
      const present = new Set(haveColumns.map((r) => `${r.table_name}.${r.column_name}`));
      const missing = COLUMNS.filter(([t, c]) => existing.has(t) && !present.has(`${t}.${c}`));
      for (const [table, column, type] of missing) {
        await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
      }
      if (missing.some(([t, c]) => t === 'products' && c === 'seo_title')) await db.query(ZORAH_LISTING_SQL);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

/** True when the columns are there (or could be added), so queries may select them. */
export const hasSeoColumns = () => ensureSeoColumns().then(() => true, () => false);

/** A posted alt text as stored: trimmed, at most 250 characters, or null when empty. */
export const parseAltText = (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 250);
  return text || null;
};
