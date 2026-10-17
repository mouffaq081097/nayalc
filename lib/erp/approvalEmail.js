import db from '../db.js';
import { sendRequisitionApprovalEmail } from '../mail.js';
import { ON_ORDER_SQL } from './catalog.js';
import { USER_NAME_SQL } from './lines.js';

// The email asking approvers to approve a submitted requisition. Sent after
// the submit commits; a failed send never undoes the submit, it is recorded on
// the PR (approval_email_sent_at / approval_email_error) so it can be resent.

/**
 * Who can approve this PR: admins with full access or the Approver role. The
 * requester is left out unless they have full access (only they may approve their own).
 */
async function approverEmails(requestedBy) {
  const { rows } = await db.query(`
    SELECT DISTINCT email FROM users
    WHERE is_admin = TRUE AND email IS NOT NULL AND email <> ''
      AND (purchasing_roles IS NULL OR ('approver' = ANY(purchasing_roles) AND id IS DISTINCT FROM $1))
  `, [requestedBy]);
  return rows.map(r => r.email);
}

async function emailDetails(id) {
  const { rows: [pr] } = await db.query(`
    SELECT r.id, r.status, r.currency, r.needed_by, r.notes, r.submitted_at, r.requested_by,
           s.name AS supplier_name, ${USER_NAME_SQL('u')} AS requested_by_name
    FROM purchase_requisitions r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    LEFT JOIN users u ON u.id = r.requested_by
    WHERE r.id = $1
  `, [id]);
  if (!pr) return null;
  const { rows: items } = await db.query(`
    SELECT i.product_name, i.quantity, i.unit_price, i.note,
           COALESCE(p.stock_quantity, 0)::int AS stock_quantity,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC NULLS LAST, pi.id LIMIT 1) AS image,
           COALESCE((SELECT SUM(oi.backordered_qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS owed,
           ${ON_ORDER_SQL} AS on_order
    FROM purchase_requisition_items i
    LEFT JOIN products p ON p.id = i.product_id
    WHERE i.requisition_id = $1
    ORDER BY i.position, i.id
  `, [id]);
  return {
    pr,
    email: {
      id: pr.id,
      requestedBy: pr.requested_by_name,
      submittedAt: pr.submitted_at,
      supplierName: pr.supplier_name,
      neededBy: pr.needed_by,
      currency: pr.currency,
      notes: pr.notes,
      items: items.map(i => ({
        name: i.product_name, imageUrl: i.image, quantity: i.quantity, unitPrice: Number(i.unit_price) || 0,
        note: i.note, stockQuantity: i.stock_quantity, owed: i.owed, onOrder: i.on_order,
      })),
    },
  };
}

/** Emails the approvers and records the outcome. Never throws: returns { sent, error } */
export async function sendApprovalEmail(id) {
  let error = null;
  try {
    const details = await emailDetails(id);
    if (!details || details.pr.status !== 'submitted') return { sent: false, error: 'Only a requisition waiting for approval can be emailed.' };
    const recipients = await approverEmails(details.pr.requested_by);
    if (recipients.length === 0) {
      error = 'Nobody can approve it yet. Give someone the Approver role under Purchasing → Team.';
    } else {
      const result = await sendRequisitionApprovalEmail(recipients, details.email);
      if (!result.success) error = `The email could not be sent: ${result.error || 'mail server error'}`;
    }
  } catch (e) {
    console.error(`PR ${id} approval email:`, e);
    error = 'The email could not be sent.';
  }
  try {
    await db.query(
      `UPDATE purchase_requisitions SET approval_email_sent_at = ${error ? 'approval_email_sent_at' : 'NOW()'}, approval_email_error = $1 WHERE id = $2`,
      [error, id]
    );
  } catch (e) {
    console.error(`PR ${id} approval email status:`, e);
  }
  return { sent: !error, error };
}
