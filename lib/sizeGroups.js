import db from './db.js';
import { ensureBackorderColumns, BACKORDER_SELECT } from './backorders.js';

/**
 * Sizes of the same product (GLYCO 200 ml / 500 ml) are separate products, each
 * with its own price, stock and page. Products that share a `size_group` show
 * each other as size options on the product page; the admin links them in the
 * product editor's "Sizes" card (/api/admin/products/[id]/sizes).
 */

export const SIZE_GROUP_MIGRATION_SQL = `
  ALTER TABLE products ADD COLUMN IF NOT EXISTS size_group TEXT;
  CREATE INDEX IF NOT EXISTS products_size_group ON products (size_group) WHERE size_group IS NOT NULL;
`;

let ensured = false;
export async function ensureSizeGroupColumn() {
  if (ensured) return;
  await db.query(SIZE_GROUP_MIGRATION_SQL);
  ensured = true;
}

/**
 * The size options shown on a product page: every product on sale in the same
 * group, this one included, cheapest first. Empty unless there are at least two.
 */
export async function getSizeOptions(productId) {
  await Promise.all([ensureSizeGroupColumn(), ensureBackorderColumns()]);
  const { rows } = await db.query(
    `SELECT p.id, p.slug, p.size, p.price, p.stock_quantity, ${BACKORDER_SELECT}
       FROM products p
      WHERE p.size_group IS NOT NULL
        AND p.size_group = (SELECT size_group FROM products WHERE id = $1)
        AND (p.id = $1 OR (p.is_active = TRUE AND (p.status = 'active' OR p.status IS NULL)))
      ORDER BY p.price, p.id`,
    [Number(productId)],
  );
  if (rows.length < 2) return [];
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    size: p.size || '',
    price: Number(p.price),
    available: Number(p.stock_quantity) > 0 || Number(p.backorderable) > 0,
  }));
}

/** The other products linked as sizes of this one (admin editor). */
export async function getLinkedSizes(productId) {
  await ensureSizeGroupColumn();
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.size, p.price
       FROM products p
      WHERE p.id <> $1
        AND p.size_group IS NOT NULL
        AND p.size_group = (SELECT size_group FROM products WHERE id = $1)
      ORDER BY p.price, p.id`,
    [Number(productId)],
  );
  return rows;
}

/**
 * Makes `otherIds` the sizes of `productId` (an empty list unlinks it). Products
 * taken out of the group are unlinked, and a group left with one product is cleared.
 */
export async function setLinkedSizes(productId, otherIds = []) {
  await ensureSizeGroupColumn();
  const id = Number(productId);
  const others = [...new Set(otherIds.map(Number).filter((n) => n && n !== id))];

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: [current] } = await client.query('SELECT size_group FROM products WHERE id = $1 FOR UPDATE', [id]);
    if (!current) throw new Error('Product not found');

    const touched = new Set();
    if (current.size_group) touched.add(current.size_group);

    if (others.length === 0) {
      await client.query('UPDATE products SET size_group = NULL WHERE id = $1', [id]);
    } else {
      const group = current.size_group || `size-${id}`;
      touched.add(group);
      const { rows: moved } = await client.query(
        'SELECT DISTINCT size_group FROM products WHERE id = ANY($1) AND size_group IS NOT NULL',
        [others],
      );
      moved.forEach((r) => touched.add(r.size_group));
      // Everyone in this group who isn't in the new list leaves it
      await client.query(
        'UPDATE products SET size_group = NULL WHERE size_group = $1 AND NOT (id = ANY($2))',
        [group, [id, ...others]],
      );
      await client.query('UPDATE products SET size_group = $1 WHERE id = ANY($2)', [group, [id, ...others]]);
    }

    // A "group" of one product is no group at all
    await client.query(
      `UPDATE products p SET size_group = NULL
        WHERE p.size_group = ANY($1)
          AND (SELECT COUNT(*) FROM products q WHERE q.size_group = p.size_group) < 2`,
      [[...touched]],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return getLinkedSizes(id);
}
