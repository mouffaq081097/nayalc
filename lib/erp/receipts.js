import db from '../db.js';
import { allocateStock } from '../backorders.js';
import { CURRENCIES, grnNumber, LANDED_CHARGE_KINDS, RECEIVABLE_PO, round2, round4 } from './documents.js';
import { PurchasingError, readDate, readInt, readMoney, readRate, readText, requireRole, transaction } from './access.js';
import { USER_NAME_SQL } from './lines.js';
import { blendAverage, costReceipt } from './landedCost.js';

// Goods received notes (GRN) and costing.
//
// 1. Receive  A storekeeper counts what arrived against the PO: accepted units,
//             rejected units, batch and expiry. Posting it puts the accepted
//             units on the shelf at the supplier price (× the GRN's exchange
//             rate), blends that into each product's weighted average cost, and
//             hands the new stock to waiting pre-orders via allocateStock().
// 2. Cost     Finance adds the landed charges (freight, customs, bank, other) and
//             finalises. The difference between the landed cost and what was
//             booked at posting is added to the average cost of the units still
//             on the shelf; the share belonging to units already sold is
//             recorded as expensed (it belongs in cost of goods sold).

// Units of each PO line already accepted on posted GRNs, other than `exceptReceiptId`
async function postedQuantities(client, purchaseOrderId, exceptReceiptId = 0) {
  const { rows } = await client.query(`
    SELECT gri.purchase_order_item_id AS id, SUM(gri.quantity_received)::int AS received
    FROM goods_receipt_items gri JOIN goods_receipts g ON g.id = gri.goods_receipt_id
    WHERE g.purchase_order_id = $1 AND g.status = 'posted' AND g.id <> $2
    GROUP BY gri.purchase_order_item_id
  `, [purchaseOrderId, exceptReceiptId]);
  return new Map(rows.map(r => [r.id, r.received]));
}

/** Opens a draft GRN for everything still to come on `po` (inside its transaction). Reuses an open draft. */
export async function createReceiptForOrder(client, access, po) {
  const { rows: [draft] } = await client.query(
    "SELECT id FROM goods_receipts WHERE purchase_order_id = $1 AND status = 'draft' ORDER BY id LIMIT 1", [po.id]
  );
  if (draft) return draft.id;

  const received = await postedQuantities(client, po.id);
  const { rows: items } = await client.query(
    'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY position, id', [po.id]
  );
  const open = items.filter(i => i.quantity - (received.get(i.id) || 0) > 0);
  if (open.length === 0) throw new PurchasingError('Everything on this order has already been received.');

  const { rows: [grn] } = await client.query(`
    INSERT INTO goods_receipts (purchase_order_id, exchange_rate, received_date, created_by)
    VALUES ($1, $2, (NOW() AT TIME ZONE 'Asia/Dubai')::date, $3) RETURNING id
  `, [po.id, po.exchange_rate, access.userId]);
  for (const [position, item] of open.entries()) {
    await client.query(`
      INSERT INTO goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, product_name, quantity_received, unit_price, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [grn.id, item.id, item.product_id, item.product_name, item.quantity - (received.get(item.id) || 0), item.unit_price, position]);
  }
  return grn.id;
}

export async function listReceipts() {
  const { rows } = await db.query(`
    SELECT g.id, g.status, g.costing_status, g.received_date, g.posted_at, g.costed_at, g.supplier_invoice, g.purchase_order_id,
           po.currency, s.name AS supplier_name,
           COALESCE((SELECT SUM(quantity_received) FROM goods_receipt_items WHERE goods_receipt_id = g.id), 0)::int AS units,
           COALESCE((SELECT SUM(quantity_rejected) FROM goods_receipt_items WHERE goods_receipt_id = g.id), 0)::int AS rejected,
           COALESCE((SELECT SUM(quantity_received * COALESCE(landed_unit_cost, base_unit_cost, unit_price * g.exchange_rate))
                     FROM goods_receipt_items WHERE goods_receipt_id = g.id), 0) AS value_aed,
           COALESCE((SELECT SUM(amount * exchange_rate) FROM landed_cost_charges WHERE goods_receipt_id = g.id), 0) AS charges_aed
    FROM goods_receipts g
    JOIN purchase_orders po ON po.id = g.purchase_order_id
    JOIN suppliers s ON s.id = po.supplier_id
    ORDER BY g.id DESC LIMIT 500
  `);
  return rows.map(r => ({ ...r, value_aed: round2(r.value_aed), charges_aed: round2(r.charges_aed) }));
}

const chargeInput = (c) => ({ amount: Number(c.amount), exchangeRate: Number(c.exchange_rate), allocation: c.allocation });

export async function getReceipt(id, client = db) {
  const { rows: [grn] } = await client.query(`
    SELECT g.*, po.status AS po_status, po.currency, po.exchange_rate AS po_exchange_rate,
           s.id AS supplier_id, s.name AS supplier_name,
           ${USER_NAME_SQL('cu')} AS created_by_name, ${USER_NAME_SQL('pu')} AS posted_by_name, ${USER_NAME_SQL('fu')} AS costed_by_name
    FROM goods_receipts g
    JOIN purchase_orders po ON po.id = g.purchase_order_id
    JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN users cu ON cu.id = g.created_by
    LEFT JOIN users pu ON pu.id = g.posted_by
    LEFT JOIN users fu ON fu.id = g.costed_by
    WHERE g.id = $1
  `, [id]);
  if (!grn) throw new PurchasingError('Goods receipt not found.', 404);

  const [{ rows: items }, { rows: charges }, received] = await Promise.all([
    client.query(`
      SELECT gri.*, poi.quantity AS ordered_qty
      FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id = gri.purchase_order_item_id
      WHERE gri.goods_receipt_id = $1 ORDER BY gri.position, gri.id
    `, [id]),
    client.query('SELECT * FROM landed_cost_charges WHERE goods_receipt_id = $1 ORDER BY position, id', [id]),
    postedQuantities(client, grn.purchase_order_id, id),
  ]);

  const rate = Number(grn.exchange_rate);
  const lines = items.map(i => {
    const earlier = received.get(i.purchase_order_item_id) || 0;
    return {
      ...i,
      unit_price: Number(i.unit_price),
      base_unit_cost: i.base_unit_cost == null ? null : Number(i.base_unit_cost),
      landed_unit_cost: i.landed_unit_cost == null ? null : Number(i.landed_unit_cost),
      received_before: earlier,
      outstanding: Math.max(0, i.ordered_qty - earlier),
    };
  });
  const chargeRows = charges.map(c => ({ ...c, amount: Number(c.amount), exchange_rate: Number(c.exchange_rate) }));

  return {
    ...grn,
    number: grnNumber(grn.id),
    exchange_rate: rate,
    po_exchange_rate: Number(grn.po_exchange_rate),
    items: lines,
    charges: chargeRows,
    costing: costReceipt(
      lines.map(l => ({ key: l.id, quantity: l.quantity_received, unitPrice: l.unit_price })),
      rate,
      chargeRows.map(chargeInput)
    ),
  };
}

async function lockReceipt(client, id) {
  const { rows: [grn] } = await client.query('SELECT * FROM goods_receipts WHERE id = $1 FOR UPDATE', [id]);
  if (!grn) throw new PurchasingError('Goods receipt not found.', 404);
  return grn;
}

/**
 * Two kinds of change:
 *   section 'receipt'  what arrived — draft only (storekeeper)
 *   section 'costing'  exchange rate, supplier invoice and landed charges — until costing is final (finance)
 */
export async function updateReceipt(access, id, body) {
  return transaction(async (client) => {
    const grn = await lockReceipt(client, id);

    if (body.section === 'costing') {
      requireRole(access, 'finance');
      if (grn.costing_status === 'finalized') throw new PurchasingError('Costing is final for this receipt.');
      const charges = (Array.isArray(body.charges) ? body.charges : []).map((c, position) => {
        const currency = String(c.currency || 'AED').toUpperCase();
        if (!CURRENCIES.includes(currency)) throw new PurchasingError('Choose a supported currency for each charge.');
        return {
          kind: LANDED_CHARGE_KINDS.some(k => k.id === c.kind) ? c.kind : 'other',
          description: readText(c.description, 300),
          amount: readMoney(c.amount, { field: 'Charge amount', allowZero: false }),
          currency,
          exchange_rate: currency === 'AED' ? 1 : readRate(c.exchange_rate, 'Charge exchange rate'),
          allocation: c.allocation === 'quantity' ? 'quantity' : 'value',
          position,
        };
      });
      if (charges.length > 50) throw new PurchasingError('A receipt can have at most 50 charges.');
      await client.query(
        'UPDATE goods_receipts SET exchange_rate = $1, supplier_invoice = $2, updated_at = NOW() WHERE id = $3',
        [readRate(body.exchange_rate), readText(body.supplier_invoice, 200), id]
      );
      await client.query('DELETE FROM landed_cost_charges WHERE goods_receipt_id = $1', [id]);
      for (const c of charges) {
        await client.query(`
          INSERT INTO landed_cost_charges (goods_receipt_id, kind, description, amount, currency, exchange_rate, allocation, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [id, c.kind, c.description, c.amount, c.currency, c.exchange_rate, c.allocation, c.position]);
      }
      return getReceipt(id, client);
    }

    requireRole(access, 'storekeeper');
    if (grn.status !== 'draft') throw new PurchasingError('This receipt is posted and can no longer be changed.');
    const { rows: existing } = await client.query('SELECT id FROM goods_receipt_items WHERE goods_receipt_id = $1', [id]);
    const lineIds = new Set(existing.map(r => r.id));
    for (const line of Array.isArray(body.items) ? body.items : []) {
      const lineId = Number(line.id);
      if (!lineIds.has(lineId)) throw new PurchasingError('A line on this receipt no longer exists. Reload the page.');
      await client.query(`
        UPDATE goods_receipt_items SET quantity_received = $1, quantity_rejected = $2, batch_number = $3, expiry_date = $4 WHERE id = $5
      `, [
        readInt(line.quantity_received, { field: 'Accepted quantity' }),
        readInt(line.quantity_rejected, { field: 'Rejected quantity' }),
        readText(line.batch_number, 100),
        readDate(line.expiry_date, 'Expiry date'),
        lineId,
      ]);
    }
    await client.query(`
      UPDATE goods_receipts SET received_date = COALESCE($1::date, received_date), supplier_invoice = $2, notes = $3,
        exchange_rate = $4, updated_at = NOW() WHERE id = $5
    `, [readDate(body.received_date, 'Received date'), readText(body.supplier_invoice, 200), readText(body.notes), readRate(body.exchange_rate), id]);
    return getReceipt(id, client);
  });
}

export async function deleteReceipt(access, id) {
  requireRole(access, 'storekeeper');
  return transaction(async (client) => {
    const grn = await lockReceipt(client, id);
    if (grn.status !== 'draft') throw new PurchasingError('A posted receipt cannot be deleted.');
    await client.query('DELETE FROM goods_receipts WHERE id = $1', [id]);
    return { deleted: id, purchaseOrderId: grn.purchase_order_id };
  });
}

// Products in ascending id order — the lock order placeOrder() and allocateStock() use
async function lockProducts(client, ids) {
  const { rows } = await client.query(
    'SELECT id, stock_quantity, average_cost FROM products WHERE id = ANY($1) ORDER BY id FOR UPDATE', [ids]
  );
  return new Map(rows.map(r => [r.id, {
    stock: Math.max(0, Number(r.stock_quantity) || 0),
    average: r.average_cost == null ? null : Number(r.average_cost),
  }]));
}

// Per-product totals of `lines`: { productId → { quantity, value } }
function byProduct(lines, quantityOf, valueOf) {
  const totals = new Map();
  for (const line of lines) {
    const quantity = quantityOf(line);
    if (quantity <= 0) continue;
    const t = totals.get(line.product_id) || { quantity: 0, value: 0 };
    t.quantity += quantity;
    t.value = round2(t.value + valueOf(line));
    totals.set(line.product_id, t);
  }
  return totals;
}

async function postReceipt(access, id) {
  requireRole(access, 'storekeeper');
  const productIds = await transaction(async (client) => {
    const grn = await lockReceipt(client, id);
    if (grn.status !== 'draft') throw new PurchasingError('This receipt is already posted.');
    const { rows: [po] } = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [grn.purchase_order_id]);
    if (!RECEIVABLE_PO.includes(po.status)) throw new PurchasingError('The purchase order is no longer open for receiving.');

    const { rows: lines } = await client.query(`
      SELECT gri.*, poi.quantity AS ordered_qty FROM goods_receipt_items gri
      JOIN purchase_order_items poi ON poi.id = gri.purchase_order_item_id
      WHERE gri.goods_receipt_id = $1
    `, [id]);
    const earlier = await postedQuantities(client, po.id, id);
    for (const line of lines) {
      const outstanding = line.ordered_qty - (earlier.get(line.purchase_order_item_id) || 0);
      if (line.quantity_received > outstanding) {
        throw new PurchasingError(`${line.product_name}: ${line.quantity_received} accepted but only ${Math.max(0, outstanding)} still to come on the order. Raise another PO for extra units.`);
      }
    }
    if (!lines.some(l => l.quantity_received > 0 || l.quantity_rejected > 0)) {
      throw new PurchasingError('Enter the quantities that arrived before posting.');
    }

    const rate = Number(grn.exchange_rate);
    const unitCost = (line) => round4(Number(line.unit_price) * rate);
    const totals = byProduct(lines, l => l.quantity_received, l => unitCost(l) * l.quantity_received);
    const ids = [...totals.keys()];
    const products = await lockProducts(client, ids);

    for (const [productId, { quantity, value }] of totals) {
      const product = products.get(productId);
      if (!product) throw new PurchasingError(`A product on this receipt (#${productId}) no longer exists.`);
      const incoming = round4(value / quantity);
      const average = blendAverage({ stock: product.stock, average: product.average, quantity, unitCost: incoming });
      await client.query(
        'UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1, average_cost = $2, last_cost = $3 WHERE id = $4',
        [quantity, average, incoming, productId]
      );
      await client.query(`
        INSERT INTO inventory_cost_ledger
          (product_id, goods_receipt_id, kind, quantity, unit_cost, value, stock_before, average_before, average_after, created_by)
        VALUES ($1, $2, 'receipt', $3, $4, $5, $6, $7, $8, $9)
      `, [productId, id, quantity, incoming, value, product.stock, product.average, average, access.userId]);
    }

    for (const line of lines) {
      await client.query('UPDATE goods_receipt_items SET base_unit_cost = $1 WHERE id = $2', [unitCost(line), line.id]);
    }
    await client.query(
      "UPDATE goods_receipts SET status = 'posted', posted_by = $1, posted_at = NOW(), updated_at = NOW() WHERE id = $2",
      [access.userId, id]
    );

    // The order is received once every line has all its units
    const { rows: [{ open }] } = await client.query(`
      SELECT COUNT(*)::int AS open FROM purchase_order_items poi
      WHERE poi.purchase_order_id = $1 AND poi.quantity > COALESCE((
        SELECT SUM(gri.quantity_received) FROM goods_receipt_items gri JOIN goods_receipts g ON g.id = gri.goods_receipt_id
        WHERE gri.purchase_order_item_id = poi.id AND g.status = 'posted'), 0)
    `, [po.id]);
    await client.query(
      `UPDATE purchase_orders SET status = $1, closed_at = ${open ? 'NULL' : 'NOW()'}, updated_at = NOW() WHERE id = $2`,
      [open ? 'partially_received' : 'received', po.id]
    );
    return ids;
  });

  // New shelf stock goes to the oldest pre-orders first. The receipt is already
  // committed, so a failure here only means allocating from the Backorders page.
  let allocation = { allocated: 0, released: [] };
  try {
    allocation = await allocateStock(productIds);
  } catch (error) {
    console.error(`GRN ${id}: stock allocation to pre-orders failed:`, error);
    allocation.error = 'Stock was received, but could not be given to waiting pre-orders. Use Allocate stock on the Backorders page.';
  }
  return { receipt: await getReceipt(id), allocation };
}

async function finalizeCosting(access, id) {
  requireRole(access, 'finance');
  await transaction(async (client) => {
    const grn = await lockReceipt(client, id);
    if (grn.status !== 'posted') throw new PurchasingError('Post the receipt before finalising its costing.');
    if (grn.costing_status === 'finalized') throw new PurchasingError('Costing is already final for this receipt.');

    const [{ rows: lines }, { rows: charges }] = await Promise.all([
      client.query('SELECT * FROM goods_receipt_items WHERE goods_receipt_id = $1', [id]),
      client.query('SELECT * FROM landed_cost_charges WHERE goods_receipt_id = $1', [id]),
    ]);
    const costing = costReceipt(
      lines.map(l => ({ key: l.id, quantity: l.quantity_received, unitPrice: Number(l.unit_price) })),
      Number(grn.exchange_rate),
      charges.map(chargeInput)
    );
    if (costing.totals.unallocated > 0) {
      throw new PurchasingError('No units were accepted on this receipt, so its charges have nothing to go on. Remove them, or book them as an expense outside purchasing.');
    }

    const costed = new Map(costing.lines.map(l => [l.key, l]));
    // What finalising adds on top of what posting booked: the charges, plus any change of exchange rate since
    const extraOf = (line) => round2(costed.get(line.id).landedTotal - Number(line.base_unit_cost) * line.quantity_received);
    const totals = byProduct(lines, l => l.quantity_received, extraOf);
    const landed = byProduct(lines, l => l.quantity_received, l => costed.get(l.id).landedTotal);
    const products = await lockProducts(client, [...totals.keys()]);

    for (const [productId, { quantity, value: extra }] of totals) {
      const product = products.get(productId) || { stock: 0, average: null };
      const landedUnit = round4(landed.get(productId).value / quantity);
      // Units sold since the receipt can't carry the extra cost any more: that share is expensed
      const stillOnShelf = Math.min(product.stock, quantity);
      const toStock = round2(extra * stillOnShelf / quantity);
      const expensed = round2(extra - toStock);
      let average = product.average;
      if (product.stock > 0) {
        average = average == null ? landedUnit : Math.max(0, round4(average + toStock / product.stock));
      }
      await client.query('UPDATE products SET average_cost = $1, last_cost = $2 WHERE id = $3', [average, landedUnit, productId]);
      await client.query(`
        INSERT INTO inventory_cost_ledger
          (product_id, goods_receipt_id, kind, quantity, unit_cost, value, expensed_value, stock_before, average_before, average_after, created_by)
        VALUES ($1, $2, 'landed_cost', $3, $4, $5, $6, $7, $8, $9, $10)
      `, [productId, id, quantity, landedUnit, extra, expensed, product.stock, product.average, average, access.userId]);
    }

    for (const line of costing.lines) {
      await client.query('UPDATE goods_receipt_items SET landed_unit_cost = $1 WHERE id = $2', [line.landedUnit, line.key]);
    }
    await client.query(
      "UPDATE goods_receipts SET costing_status = 'finalized', costed_by = $1, costed_at = NOW(), updated_at = NOW() WHERE id = $2",
      [access.userId, id]
    );
  });
  return { receipt: await getReceipt(id) };
}

export async function actOnReceipt(access, id, body) {
  switch (String(body.action || '')) {
    case 'post': return postReceipt(access, id);
    case 'finalize': return finalizeCosting(access, id);
    default: throw new PurchasingError('Unknown action.');
  }
}
