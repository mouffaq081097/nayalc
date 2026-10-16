import { PurchasingError, readInt, readMoney, readText } from './access.js';
import { productNames } from './catalog.js';

export const USER_NAME_SQL = (alias) => `COALESCE(NULLIF(TRIM(CONCAT(${alias}.first_name, ' ', ${alias}.last_name)), ''), ${alias}.email)`;

/**
 * Reads the product lines of a PR or PO from a request body.
 * Returns [{ product_id, product_name, quantity, unit_price?, note?, requisition_item_id? }].
 */
export async function readLines(client, items, { withPrice = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new PurchasingError('Add at least one product.');
  if (items.length > 300) throw new PurchasingError('A document can have at most 300 lines.');

  const lines = items.map(item => ({
    product_id: readInt(item.product_id, { min: 1, max: 2_147_483_647, field: 'Product' }),
    quantity: readInt(item.quantity, { min: 1, max: 1_000_000 }),
    ...(withPrice ? { unit_price: readMoney(item.unit_price, { field: 'Unit price' }) } : {}),
    note: readText(item.note, 500),
    requisition_item_id: Number.isInteger(Number(item.requisition_item_id)) && Number(item.requisition_item_id) > 0
      ? Number(item.requisition_item_id) : null,
  }));

  const names = await productNames(client, [...new Set(lines.map(l => l.product_id))]);
  const seen = new Set();
  for (const line of lines) {
    if (seen.has(line.product_id)) throw new PurchasingError(`${names.get(line.product_id)} is on the list twice. Combine the quantities on one line.`);
    seen.add(line.product_id);
    line.product_name = names.get(line.product_id);
  }
  return lines;
}
