import db from '../db.js';
import { PurchasingError, readDate, readText, requireAnyRole, requireRole, transaction } from './access.js';
import { hasRole, pageRoles } from './roles.js';
import { prNumber } from './documents.js';
import { readLines, USER_NAME_SQL } from './lines.js';
import { createPurchaseOrder } from './purchaseOrders.js';

// Purchase requisitions: someone asks for stock, an approver says yes or no,
// a buyer turns an approved request into a purchase order.

const LIST_SQL = `
  SELECT r.id, r.status, r.needed_by, r.created_at, r.submitted_at, r.decided_at, r.requested_by, r.decided_by,
         s.name AS supplier_name, ${USER_NAME_SQL('u')} AS requested_by_name,
         (SELECT COUNT(*) FROM purchase_requisition_items i WHERE i.requisition_id = r.id)::int AS line_count,
         COALESCE((SELECT SUM(i.quantity) FROM purchase_requisition_items i WHERE i.requisition_id = r.id), 0)::int AS units,
         (SELECT po.id FROM purchase_orders po WHERE po.requisition_id = r.id AND po.status <> 'cancelled' ORDER BY po.id DESC LIMIT 1) AS purchase_order_id
  FROM purchase_requisitions r
  LEFT JOIN suppliers s ON s.id = r.supplier_id
  LEFT JOIN users u ON u.id = r.requested_by
`;

/**
 * Which requisitions a role-limited member sees (full access sees all):
 *   approver   those awaiting approval, and those they decided
 *   requester  their own
 *   buyer      approved ones, to order
 */
function visibleTo(access, pr) {
  if (access.full) return true;
  return (hasRole(access, 'approver') && (pr.status === 'submitted' || pr.decided_by === access.userId))
    || (hasRole(access, 'requester') && pr.requested_by === access.userId)
    || (hasRole(access, 'buyer') && ['approved', 'converted'].includes(pr.status));
}

export async function listRequisitions(access) {
  requireAnyRole(access, pageRoles('/admin/purchasing/requisitions'));
  const { rows } = await db.query(`${LIST_SQL} ORDER BY r.id DESC LIMIT 500`);
  return rows.filter(pr => visibleTo(access, pr));
}

/** A requisition, if this user may see it */
export async function getVisibleRequisition(access, id) {
  requireAnyRole(access, pageRoles('/admin/purchasing/requisitions'));
  const pr = await getRequisition(id);
  if (!visibleTo(access, pr)) throw new PurchasingError('Requisition not found.', 404);
  return pr;
}

export async function getRequisition(id, client = db) {
  const { rows: [pr] } = await client.query(`
    SELECT r.*, s.name AS supplier_name, s.currency AS supplier_currency,
           ${USER_NAME_SQL('u')} AS requested_by_name, ${USER_NAME_SQL('d')} AS decided_by_name
    FROM purchase_requisitions r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    LEFT JOIN users u ON u.id = r.requested_by
    LEFT JOIN users d ON d.id = r.decided_by
    WHERE r.id = $1
  `, [id]);
  if (!pr) throw new PurchasingError('Requisition not found.', 404);
  const [{ rows: items }, { rows: orders }] = await Promise.all([
    client.query('SELECT * FROM purchase_requisition_items WHERE requisition_id = $1 ORDER BY position, id', [id]),
    client.query("SELECT id, status FROM purchase_orders WHERE requisition_id = $1 ORDER BY id", [id]),
  ]);
  return { ...pr, number: prNumber(pr.id), items, purchase_orders: orders };
}

async function writeItems(client, requisitionId, lines) {
  await client.query('DELETE FROM purchase_requisition_items WHERE requisition_id = $1', [requisitionId]);
  for (const [position, line] of lines.entries()) {
    await client.query(
      'INSERT INTO purchase_requisition_items (requisition_id, product_id, product_name, quantity, note, position) VALUES ($1, $2, $3, $4, $5, $6)',
      [requisitionId, line.product_id, line.product_name, line.quantity, line.note, position]
    );
  }
}

const readHeader = (body) => ({
  supplier_id: Number(body.supplier_id) > 0 ? Number(body.supplier_id) : null,
  needed_by: readDate(body.needed_by, 'Needed by'),
  notes: readText(body.notes),
});

export async function createRequisition(access, body) {
  requireRole(access, 'requester');
  return transaction(async (client) => {
    const header = readHeader(body);
    const lines = await readLines(client, body.items);
    const submit = body.submit === true;
    const { rows: [pr] } = await client.query(`
      INSERT INTO purchase_requisitions (status, supplier_id, needed_by, notes, requested_by, submitted_at)
      VALUES ($1, $2, $3, $4, $5, ${submit ? 'NOW()' : 'NULL'}) RETURNING id
    `, [submit ? 'submitted' : 'draft', header.supplier_id, header.needed_by, header.notes, access.userId]);
    await writeItems(client, pr.id, lines);
    return getRequisition(pr.id, client);
  });
}

// The person who raised it may change it; full access may change anyone's
const canEdit = (access, pr) => access.full || (hasRole(access, 'requester') && pr.requested_by === access.userId);

async function lockRequisition(client, id) {
  const { rows: [pr] } = await client.query('SELECT * FROM purchase_requisitions WHERE id = $1 FOR UPDATE', [id]);
  if (!pr) throw new PurchasingError('Requisition not found.', 404);
  return pr;
}

export async function updateRequisition(access, id, body) {
  return transaction(async (client) => {
    const pr = await lockRequisition(client, id);
    if (!canEdit(access, pr)) throw new PurchasingError('Only the person who raised this requisition can change it.', 403);
    if (pr.status !== 'draft') throw new PurchasingError('Only a draft can be changed. Withdraw it first.');
    const header = readHeader(body);
    const lines = await readLines(client, body.items);
    await client.query(
      'UPDATE purchase_requisitions SET supplier_id = $1, needed_by = $2, notes = $3, updated_at = NOW() WHERE id = $4',
      [header.supplier_id, header.needed_by, header.notes, id]
    );
    await writeItems(client, id, lines);
    return getRequisition(id, client);
  });
}

export async function deleteRequisition(access, id) {
  return transaction(async (client) => {
    const pr = await lockRequisition(client, id);
    if (!canEdit(access, pr)) throw new PurchasingError('Only the person who raised this requisition can delete it.', 403);
    if (pr.status !== 'draft') throw new PurchasingError('Only a draft can be deleted. Cancel it instead.');
    await client.query('DELETE FROM purchase_requisitions WHERE id = $1', [id]);
    return { deleted: id };
  });
}

/**
 * Moves a requisition along:
 *   submit   draft → submitted              (whoever raised it)
 *   withdraw submitted → draft               (whoever raised it)
 *   approve  submitted → approved            (approver — not their own, unless full access)
 *   reject   submitted → rejected, with note (approver)
 *   reopen   rejected → draft                (whoever raised it)
 *   cancel   any open state → cancelled      (whoever raised it, or an approver)
 *   convert  approved → converted + new draft PO (buyer)
 */
export async function actOnRequisition(access, id, body) {
  const action = String(body.action || '');
  return transaction(async (client) => {
    const pr = await lockRequisition(client, id);
    const owner = canEdit(access, pr);
    const from = (...states) => {
      if (!states.includes(pr.status)) throw new PurchasingError(`This requisition is ${pr.status}, so it can't be ${ACTION_PAST[action] || 'changed'}.`);
    };
    const set = (status, extra = '', params = []) => client.query(
      `UPDATE purchase_requisitions SET status = $1, updated_at = NOW()${extra} WHERE id = $2`, [status, id, ...params]
    );
    let purchaseOrderId = null;

    switch (action) {
      case 'submit': {
        if (!owner) throw new PurchasingError('Only the person who raised this requisition can submit it.', 403);
        from('draft');
        const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int AS count FROM purchase_requisition_items WHERE requisition_id = $1', [id]);
        if (!count) throw new PurchasingError('Add at least one product before submitting.');
        await set('submitted', ', submitted_at = NOW(), decided_by = NULL, decided_at = NULL, decision_note = NULL');
        break;
      }
      case 'withdraw':
        if (!owner) throw new PurchasingError('Only the person who raised this requisition can withdraw it.', 403);
        from('submitted');
        await set('draft', ', submitted_at = NULL');
        break;
      case 'approve':
      case 'reject': {
        requireRole(access, 'approver');
        from('submitted');
        if (pr.requested_by === access.userId && !access.full) {
          throw new PurchasingError('You raised this requisition, so someone else has to approve it.', 403);
        }
        const note = readText(body.note, 1000);
        if (action === 'reject' && !note) throw new PurchasingError('Say why it was rejected, so the requester can fix it.');
        await set(action === 'approve' ? 'approved' : 'rejected', ', decided_by = $3, decided_at = NOW(), decision_note = $4', [access.userId, note]);
        break;
      }
      case 'reopen':
        if (!owner) throw new PurchasingError('Only the person who raised this requisition can reopen it.', 403);
        from('rejected');
        await set('draft', ', submitted_at = NULL');
        break;
      case 'cancel':
        if (!owner && !hasRole(access, 'approver')) throw new PurchasingError('Only the requester or an approver can cancel this.', 403);
        from('draft', 'submitted', 'approved', 'rejected');
        await set('cancelled');
        break;
      case 'convert': {
        requireRole(access, 'buyer');
        from('approved');
        const supplierId = Number(body.supplier_id) > 0 ? Number(body.supplier_id) : pr.supplier_id;
        if (!supplierId) throw new PurchasingError('Choose the supplier to order from.');
        const { rows: items } = await client.query(
          'SELECT * FROM purchase_requisition_items WHERE requisition_id = $1 ORDER BY position, id', [id]
        );
        purchaseOrderId = await createPurchaseOrder(client, access, {
          supplierId,
          requisitionId: id,
          expectedDate: pr.needed_by,
          notes: null,
          lines: items.map(i => ({
            product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: null, requisition_item_id: i.id,
          })),
        });
        await set('converted');
        break;
      }
      default:
        throw new PurchasingError('Unknown action.');
    }

    return { requisition: await getRequisition(id, client), purchaseOrderId };
  });
}

const ACTION_PAST = {
  submit: 'submitted', withdraw: 'withdrawn', approve: 'approved', reject: 'rejected',
  reopen: 'reopened', cancel: 'cancelled', convert: 'turned into a purchase order',
};
