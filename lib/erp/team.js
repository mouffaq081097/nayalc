import db from '../db.js';
import { PurchasingError } from './access.js';
import { cleanRoles, ROLE_IDS } from './roles.js';
import { ON_ORDER_SQL } from './catalog.js';

// Who may do what in purchasing, and the overview page's figures.

export async function listTeam() {
  const { rows } = await db.query(`
    SELECT id, email, first_name, last_name, purchasing_roles
    FROM users WHERE is_admin = TRUE ORDER BY first_name NULLS LAST, email
  `);
  return rows.map(u => ({ ...u, full: u.purchasing_roles == null, roles: u.purchasing_roles || [] }));
}

/** body: { userId, full: true } or { userId, roles: [...] }. Full access only. */
export async function setTeamRoles(access, body) {
  if (!access.full) throw new PurchasingError('Only an admin with full purchasing access can change roles.', 403);
  const userId = Number(body.userId);
  if (!Number.isInteger(userId) || userId < 1) throw new PurchasingError('Choose a team member.');
  if (userId === access.userId && body.full !== true) {
    throw new PurchasingError("You can't limit your own access. Ask another admin with full access.");
  }
  const roles = body.full === true ? null : cleanRoles(Array.isArray(body.roles) ? body.roles : []);
  if (roles && roles.some(r => !ROLE_IDS.includes(r))) throw new PurchasingError('Unknown role.');

  const { rows: [user] } = await db.query(
    'UPDATE users SET purchasing_roles = $1 WHERE id = $2 AND is_admin = TRUE RETURNING id, purchasing_roles',
    [roles, userId]
  );
  if (!user) throw new PurchasingError('That person no longer has admin access.', 404);
  return { userId: user.id, full: user.purchasing_roles == null, roles: user.purchasing_roles || [] };
}

export async function purchasingOverview(access) {
  const { rows: [counts] } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM purchase_requisitions WHERE status = 'submitted')::int AS awaiting_approval,
      (SELECT COUNT(*) FROM purchase_requisitions WHERE status = 'approved')::int AS approved_to_order,
      (SELECT COUNT(*) FROM purchase_requisitions WHERE status IN ('draft', 'rejected') AND requested_by = $1)::int AS my_drafts,
      (SELECT COUNT(*) FROM purchase_orders WHERE status = 'draft')::int AS draft_orders,
      (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('sent', 'partially_received'))::int AS open_orders,
      (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('sent', 'partially_received') AND expected_date < (NOW() AT TIME ZONE 'Asia/Dubai')::date)::int AS late_orders,
      (SELECT COUNT(*) FROM goods_receipts WHERE status = 'draft')::int AS draft_receipts,
      (SELECT COUNT(*) FROM goods_receipts WHERE status = 'posted' AND costing_status = 'open')::int AS awaiting_costing,
      (SELECT COALESCE(SUM(GREATEST(stock_quantity, 0) * average_cost), 0) FROM products WHERE average_cost IS NOT NULL) AS stock_value,
      (SELECT COUNT(*) FROM products WHERE average_cost IS NULL AND COALESCE(stock_quantity, 0) > 0)::int AS uncosted_products
  `, [access.userId]);

  // Products customers are waiting for that no open PO covers yet
  const { rows: shortfalls } = await db.query(`
    SELECT * FROM (
      SELECT p.id, p.name, COALESCE(p.stock_quantity, 0)::int AS stock_quantity,
             COALESCE((SELECT SUM(oi.backordered_qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS owed,
             ${ON_ORDER_SQL} AS on_order
      FROM products p
    ) x WHERE x.owed > x.on_order ORDER BY x.owed - x.on_order DESC LIMIT 20
  `);

  return { ...counts, stock_value: Number(counts.stock_value), shortfalls };
}
