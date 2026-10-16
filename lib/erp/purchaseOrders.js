import db from '../db.js';
import { CURRENCIES, poNumber, RECEIVABLE_PO, round2 } from './documents.js';
import { PurchasingError, readDate, readRate, readText, requireRole, transaction } from './access.js';
import { readLines, USER_NAME_SQL } from './lines.js';
import { createReceiptForOrder } from './receipts.js';

// Purchase orders: what we buy from a supplier, at what price, in their currency.
// The PO's exchange rate is an estimate for planning; the GRN carries the rate
// actually paid, and that is the one costing uses.

// Currencies pegged to the dirham's anchor, used when no PO has a rate yet
const PEGGED_RATES = { AED: 1, USD: 3.6725, SAR: 0.9793 };

async function defaultRate(client, currency) {
  if (currency === 'AED') return 1;
  const { rows: [last] } = await client.query(
    "SELECT exchange_rate FROM purchase_orders WHERE currency = $1 AND exchange_rate <> 1 ORDER BY id DESC LIMIT 1", [currency]
  );
  return last ? Number(last.exchange_rate) : (PEGGED_RATES[currency] ?? 1);
}

// The last price this supplier charged for each product, in the given currency
async function lastPrices(client, supplierId, currency, productIds) {
  const { rows } = await client.query(`
    SELECT DISTINCT ON (poi.product_id) poi.product_id, poi.unit_price
    FROM purchase_order_items poi JOIN purchase_orders po ON po.id = poi.purchase_order_id
    WHERE po.supplier_id = $1 AND po.currency = $2 AND poi.product_id = ANY($3) AND po.status <> 'cancelled'
    ORDER BY poi.product_id, po.id DESC
  `, [supplierId, currency, productIds]);
  return new Map(rows.map(r => [r.product_id, Number(r.unit_price)]));
}

async function activeSupplier(client, supplierId) {
  const { rows: [supplier] } = await client.query('SELECT id, currency, is_active FROM suppliers WHERE id = $1', [supplierId]);
  if (!supplier) throw new PurchasingError('Supplier not found.', 404);
  if (!supplier.is_active) throw new PurchasingError('This supplier is archived. Choose another, or reactivate it under Suppliers.');
  return supplier;
}

async function writeItems(client, orderId, lines) {
  await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [orderId]);
  for (const [position, line] of lines.entries()) {
    await client.query(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, unit_price, requisition_item_id, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [orderId, line.product_id, line.product_name, line.quantity, line.unit_price, line.requisition_item_id || null, position]);
  }
}

/**
 * Creates a draft PO inside an open transaction and returns its id. Lines with
 * unit_price null take the supplier's last price for that product.
 */
export async function createPurchaseOrder(client, access, { supplierId, requisitionId = null, currency, exchangeRate, orderDate, expectedDate, supplierReference, notes, lines }) {
  const supplier = await activeSupplier(client, supplierId);
  const cur = currency || supplier.currency;
  const rate = exchangeRate ?? await defaultRate(client, cur);
  const prices = await lastPrices(client, supplierId, cur, lines.map(l => l.product_id));
  const priced = lines.map(l => ({ ...l, unit_price: l.unit_price ?? prices.get(l.product_id) ?? 0 }));

  const { rows: [po] } = await client.query(`
    INSERT INTO purchase_orders (supplier_id, requisition_id, currency, exchange_rate, order_date, expected_date, supplier_reference, notes, created_by)
    VALUES ($1, $2, $3, $4, COALESCE($5::date, (NOW() AT TIME ZONE 'Asia/Dubai')::date), $6, $7, $8, $9) RETURNING id
  `, [supplierId, requisitionId, cur, rate, orderDate || null, expectedDate || null, supplierReference || null, notes || null, access.userId]);
  await writeItems(client, po.id, priced);
  return po.id;
}

function readHeader(body) {
  const currency = String(body.currency || '').toUpperCase();
  if (!CURRENCIES.includes(currency)) throw new PurchasingError('Choose a supported currency.');
  return {
    supplierId: Number(body.supplier_id) > 0 ? Number(body.supplier_id) : null,
    currency,
    exchangeRate: currency === 'AED' ? 1 : readRate(body.exchange_rate),
    orderDate: readDate(body.order_date, 'Order date'),
    expectedDate: readDate(body.expected_date, 'Expected date'),
    supplierReference: readText(body.supplier_reference, 200),
    notes: readText(body.notes),
  };
}

export async function createPurchaseOrderFromBody(access, body) {
  requireRole(access, 'buyer');
  return transaction(async (client) => {
    const header = readHeader(body);
    if (!header.supplierId) throw new PurchasingError('Choose a supplier.');
    const lines = await readLines(client, body.items, { withPrice: true });
    const id = await createPurchaseOrder(client, access, { ...header, lines });
    return getPurchaseOrder(id, client);
  });
}

const LIST_SQL = `
  SELECT po.id, po.status, po.currency, po.exchange_rate, po.order_date, po.expected_date, po.requisition_id, po.created_at,
         s.name AS supplier_name,
         COALESCE((SELECT SUM(i.quantity * i.unit_price) FROM purchase_order_items i WHERE i.purchase_order_id = po.id), 0) AS total,
         COALESCE((SELECT SUM(i.quantity) FROM purchase_order_items i WHERE i.purchase_order_id = po.id), 0)::int AS units,
         COALESCE((SELECT SUM(gri.quantity_received) FROM goods_receipt_items gri JOIN goods_receipts g ON g.id = gri.goods_receipt_id
                   WHERE g.purchase_order_id = po.id AND g.status = 'posted'), 0)::int AS received_units
  FROM purchase_orders po JOIN suppliers s ON s.id = po.supplier_id
`;

export async function listPurchaseOrders() {
  const { rows } = await db.query(`${LIST_SQL} ORDER BY po.id DESC LIMIT 500`);
  return rows.map(r => ({ ...r, total: Number(r.total), exchange_rate: Number(r.exchange_rate) }));
}

export async function getPurchaseOrder(id, client = db) {
  const { rows: [po] } = await client.query(`
    SELECT po.*, row_to_json(s) AS supplier, ${USER_NAME_SQL('u')} AS created_by_name, ${USER_NAME_SQL('su')} AS sent_by_name
    FROM purchase_orders po
    JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN users u ON u.id = po.created_by
    LEFT JOIN users su ON su.id = po.sent_by
    WHERE po.id = $1
  `, [id]);
  if (!po) throw new PurchasingError('Purchase order not found.', 404);

  const [{ rows: items }, { rows: receipts }] = await Promise.all([
    client.query(`
      SELECT poi.*,
        COALESCE(SUM(gri.quantity_received) FILTER (WHERE g.status = 'posted'), 0)::int AS received_qty,
        COALESCE(SUM(gri.quantity_rejected) FILTER (WHERE g.status = 'posted'), 0)::int AS rejected_qty
      FROM purchase_order_items poi
      LEFT JOIN goods_receipt_items gri ON gri.purchase_order_item_id = poi.id
      LEFT JOIN goods_receipts g ON g.id = gri.goods_receipt_id
      WHERE poi.purchase_order_id = $1
      GROUP BY poi.id ORDER BY poi.position, poi.id
    `, [id]),
    client.query(`
      SELECT g.id, g.status, g.costing_status, g.received_date, g.posted_at, g.supplier_invoice,
        COALESCE((SELECT SUM(quantity_received) FROM goods_receipt_items WHERE goods_receipt_id = g.id), 0)::int AS units
      FROM goods_receipts g WHERE g.purchase_order_id = $1 ORDER BY g.id
    `, [id]),
  ]);

  const lines = items.map(i => ({ ...i, unit_price: Number(i.unit_price), outstanding: Math.max(0, i.quantity - i.received_qty) }));
  const subtotal = round2(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0));
  const rate = Number(po.exchange_rate);
  return {
    ...po,
    number: poNumber(po.id),
    exchange_rate: rate,
    items: lines,
    receipts,
    subtotal,
    subtotal_aed: round2(subtotal * rate),
  };
}

async function lockOrder(client, id) {
  const { rows: [po] } = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [id]);
  if (!po) throw new PurchasingError('Purchase order not found.', 404);
  return po;
}

export async function updatePurchaseOrder(access, id, body) {
  requireRole(access, 'buyer');
  return transaction(async (client) => {
    const po = await lockOrder(client, id);
    if (['received', 'closed', 'cancelled'].includes(po.status)) throw new PurchasingError('This purchase order is finished and can no longer be changed.');

    if (po.status !== 'draft') {
      // Once sent, the lines are what the supplier agreed to; only the paperwork can change
      await client.query(
        'UPDATE purchase_orders SET expected_date = $1, supplier_reference = $2, notes = $3, updated_at = NOW() WHERE id = $4',
        [readDate(body.expected_date, 'Expected date'), readText(body.supplier_reference, 200), readText(body.notes), id]
      );
      return getPurchaseOrder(id, client);
    }

    const header = readHeader(body);
    if (!header.supplierId) throw new PurchasingError('Choose a supplier.');
    await activeSupplier(client, header.supplierId);
    const lines = await readLines(client, body.items, { withPrice: true });
    await client.query(`
      UPDATE purchase_orders SET supplier_id = $1, currency = $2, exchange_rate = $3, order_date = COALESCE($4::date, order_date),
        expected_date = $5, supplier_reference = $6, notes = $7, updated_at = NOW()
      WHERE id = $8
    `, [header.supplierId, header.currency, header.exchangeRate, header.orderDate, header.expectedDate, header.supplierReference, header.notes, id]);
    await writeItems(client, id, lines);
    return getPurchaseOrder(id, client);
  });
}

export async function deletePurchaseOrder(access, id) {
  requireRole(access, 'buyer');
  return transaction(async (client) => {
    const po = await lockOrder(client, id);
    if (po.status !== 'draft') throw new PurchasingError('Only a draft can be deleted. Cancel it instead.');
    await client.query('DELETE FROM purchase_orders WHERE id = $1', [id]);
    // The approved request goes back to the buyer's queue
    if (po.requisition_id) {
      await client.query("UPDATE purchase_requisitions SET status = 'approved', updated_at = NOW() WHERE id = $1 AND status = 'converted'", [po.requisition_id]);
    }
    return { deleted: id };
  });
}

/**
 * send     draft → sent                 (buyer)
 * cancel   draft/sent, nothing received → cancelled (buyer)
 * close    partially received → closed: stop waiting for the rest (buyer)
 * receive  sent/partially received → opens a draft GRN (storekeeper)
 */
export async function actOnPurchaseOrder(access, id, body) {
  const action = String(body.action || '');
  return transaction(async (client) => {
    const po = await lockOrder(client, id);
    let receiptId = null;

    switch (action) {
      case 'send': {
        requireRole(access, 'buyer');
        if (po.status !== 'draft') throw new PurchasingError('Only a draft can be sent.');
        const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int AS count FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
        if (!count) throw new PurchasingError('Add at least one product before sending.');
        if (po.currency !== 'AED' && Number(po.exchange_rate) === 1) {
          throw new PurchasingError(`Enter the ${po.currency} to AED exchange rate before sending.`);
        }
        await client.query("UPDATE purchase_orders SET status = 'sent', sent_at = NOW(), sent_by = $1, updated_at = NOW() WHERE id = $2", [access.userId, id]);
        break;
      }
      case 'cancel': {
        requireRole(access, 'buyer');
        if (!['draft', 'sent'].includes(po.status)) throw new PurchasingError('Goods were already received on this order. Close it instead.');
        const { rows: [{ count }] } = await client.query("SELECT COUNT(*)::int AS count FROM goods_receipts WHERE purchase_order_id = $1 AND status = 'posted'", [id]);
        if (count) throw new PurchasingError('Goods were already received on this order. Close it instead.');
        await client.query("DELETE FROM goods_receipts WHERE purchase_order_id = $1 AND status = 'draft'", [id]);
        await client.query("UPDATE purchase_orders SET status = 'cancelled', closed_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
        break;
      }
      case 'close': {
        requireRole(access, 'buyer');
        if (po.status !== 'partially_received') throw new PurchasingError('Only a partially received order can be closed.');
        const { rows: [{ count }] } = await client.query("SELECT COUNT(*)::int AS count FROM goods_receipts WHERE purchase_order_id = $1 AND status = 'draft'", [id]);
        if (count) throw new PurchasingError('Post or delete the draft goods receipt on this order first.');
        await client.query("UPDATE purchase_orders SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
        break;
      }
      case 'receive':
        requireRole(access, 'storekeeper');
        if (!RECEIVABLE_PO.includes(po.status)) throw new PurchasingError('Goods can only be received on an order that was sent to the supplier.');
        receiptId = await createReceiptForOrder(client, access, po);
        break;
      default:
        throw new PurchasingError('Unknown action.');
    }
    return { order: await getPurchaseOrder(id, client), receiptId };
  });
}
