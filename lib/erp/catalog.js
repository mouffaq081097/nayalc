import db from '../db.js';
import { CURRENCIES, round4 } from './documents.js';
import { PurchasingError, readInt, readMoney, readText, requireRole, transaction } from './access.js';

// Suppliers, and the product view purchasing works from.

// Units still to come on purchase orders that have gone to the supplier
export const ON_ORDER_SQL = `COALESCE((
  SELECT SUM(GREATEST(0, poi.quantity - COALESCE((
    SELECT SUM(gri.quantity_received) FROM goods_receipt_items gri
    JOIN goods_receipts g ON g.id = gri.goods_receipt_id
    WHERE gri.purchase_order_item_id = poi.id AND g.status = 'posted'), 0)))
  FROM purchase_order_items poi
  JOIN purchase_orders po ON po.id = poi.purchase_order_id
  WHERE poi.product_id = p.id AND po.status IN ('sent', 'partially_received')
), 0)::int`;

/** Every product with what purchasing needs to decide what to buy and what it cost */
export async function listPurchasingProducts() {
  const { rows } = await db.query(`
    SELECT p.id, p.name, p.status, p.price, p.vendor,
           COALESCE(p.stock_quantity, 0)::int AS stock_quantity,
           p.average_cost, p.last_cost,
           b.id AS brand_id, b.name AS brand,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC NULLS LAST, pi.id LIMIT 1) AS image,
           COALESCE((SELECT SUM(oi.backordered_qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS owed,
           ${ON_ORDER_SQL} AS on_order
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    ORDER BY p.name
  `);
  return rows.map(r => ({
    ...r,
    price: Number(r.price) || 0,
    average_cost: r.average_cost == null ? null : Number(r.average_cost),
    last_cost: r.last_cost == null ? null : Number(r.last_cost),
  }));
}

/** Product names for document lines, so a line always says what it was */
export async function productNames(client, ids) {
  const { rows } = await client.query('SELECT id, name FROM products WHERE id = ANY($1)', [ids]);
  const names = new Map(rows.map(r => [r.id, r.name]));
  const missing = ids.filter(id => !names.has(id));
  if (missing.length) throw new PurchasingError(`Product #${missing[0]} no longer exists. Remove it from the list.`);
  return names;
}

/**
 * Sets a product's cost by hand — for stock that was on the shelf before
 * purchasing was used, or to correct one. Booked in the cost ledger.
 */
export async function setProductCost(access, body) {
  requireRole(access, 'finance');
  const productId = readInt(body.productId, { min: 1, max: 2_147_483_647, field: 'Product' });
  const cost = round4(readMoney(body.average_cost, { field: 'Cost' }));
  const note = readText(body.note, 500);

  return transaction(async (client) => {
    const { rows: [product] } = await client.query(
      'SELECT id, stock_quantity, average_cost FROM products WHERE id = $1 FOR UPDATE', [productId]
    );
    if (!product) throw new PurchasingError('Product not found.', 404);
    await client.query('UPDATE products SET average_cost = $1 WHERE id = $2', [cost, productId]);
    const stock = Math.max(0, Number(product.stock_quantity) || 0);
    const before = product.average_cost == null ? null : Number(product.average_cost);
    await client.query(`
      INSERT INTO inventory_cost_ledger
        (product_id, kind, quantity, unit_cost, value, stock_before, average_before, average_after, note, created_by)
      VALUES ($1, $2, $3, $4, $5, $3, $6, $4, $7, $8)
    `, [productId, before == null ? 'opening' : 'adjustment', stock, cost,
        Math.round(stock * (cost - (before ?? 0)) * 100) / 100, before, note, access.userId]);
    return { productId, average_cost: cost };
  });
}

/** A product's cost history, newest first */
export async function productCostHistory(productId) {
  const { rows } = await db.query(`
    SELECT l.*, COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) AS created_by_name
    FROM inventory_cost_ledger l LEFT JOIN users u ON u.id = l.created_by
    WHERE l.product_id = $1 ORDER BY l.created_at DESC, l.id DESC LIMIT 100
  `, [productId]);
  return rows;
}

// ── Suppliers ──

const SUPPLIER_FIELDS = ['name', 'contact_name', 'email', 'phone', 'country', 'address', 'tax_number', 'currency', 'payment_terms', 'lead_days', 'notes', 'is_active'];

function readSupplier(body) {
  const name = readText(body.name, 200);
  if (!name) throw new PurchasingError('Enter the supplier name.');
  const currency = String(body.currency || 'AED').toUpperCase();
  if (!CURRENCIES.includes(currency)) throw new PurchasingError('Choose a supported currency.');
  const email = readText(body.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PurchasingError('Enter a valid email address.');
  return {
    name,
    contact_name: readText(body.contact_name, 200),
    email,
    phone: readText(body.phone, 50),
    country: readText(body.country, 100),
    address: readText(body.address, 1000),
    tax_number: readText(body.tax_number, 50),
    currency,
    payment_terms: readText(body.payment_terms, 200),
    lead_days: body.lead_days === '' || body.lead_days == null ? null : readInt(body.lead_days, { min: 0, max: 365, field: 'Lead time' }),
    notes: readText(body.notes),
    is_active: body.is_active !== false,
  };
}

export async function listSuppliers() {
  const { rows } = await db.query(`
    SELECT s.*,
      (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status <> 'cancelled')::int AS order_count,
      (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status IN ('sent', 'partially_received'))::int AS open_count
    FROM suppliers s ORDER BY s.is_active DESC, s.name
  `);
  return rows;
}

export async function saveSupplier(access, id, body) {
  requireRole(access, 'buyer');
  const s = readSupplier(body);
  const values = SUPPLIER_FIELDS.map(f => s[f]);
  if (!id) {
    const { rows: [row] } = await db.query(
      `INSERT INTO suppliers (${SUPPLIER_FIELDS.join(', ')}) VALUES (${SUPPLIER_FIELDS.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      values
    );
    return row;
  }
  const { rows: [row] } = await db.query(
    `UPDATE suppliers SET ${SUPPLIER_FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = NOW()
     WHERE id = $${SUPPLIER_FIELDS.length + 1} RETURNING *`,
    [...values, id]
  );
  if (!row) throw new PurchasingError('Supplier not found.', 404);
  return row;
}
