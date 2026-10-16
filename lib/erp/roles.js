// Purchasing roles — isomorphic (API routes and admin pages).
//
// Purchasing sits inside the admin portal, so every user here already has admin
// access (users.is_admin). On top of that, users.purchasing_roles limits what
// they may do in purchasing:
//   NULL      full access (every role, and managing the team) — existing admins
//   [...]     only those roles; an empty array can look but not act

export const PURCHASING_ROLES = [
  { id: 'requester',   label: 'Requester',   description: 'Raises purchase requisitions and submits them for approval' },
  { id: 'approver',    label: 'Approver',    description: 'Approves or rejects submitted requisitions' },
  { id: 'buyer',       label: 'Buyer',       description: 'Manages suppliers and raises, sends and closes purchase orders' },
  { id: 'storekeeper', label: 'Storekeeper', description: 'Receives goods against purchase orders (GRN) and posts them to stock' },
  { id: 'finance',     label: 'Finance',     description: 'Enters landed costs, finalises costing and sets product costs' },
];

export const ROLE_IDS = PURCHASING_ROLES.map(r => r.id);

export const roleLabel = (id) => PURCHASING_ROLES.find(r => r.id === id)?.label || id;

/** access = { userId, full, roles } from /api/admin/purchasing/me or purchasingAccess() */
export const hasRole = (access, role) => Boolean(access && (access.full || access.roles?.includes(role)));

// The only admin pages a role-limited member ("staff" session role) can open.
// Their APIs check the same roles, so this is not just hiding links.
export const STAFF_PAGES = [
  { to: '/admin/purchasing/requisitions', text: 'Requisitions', roles: ['requester', 'approver', 'buyer'] },
  { to: '/admin/purchasing/orders', text: 'Purchase orders', roles: ['buyer', 'storekeeper', 'finance'] },
  { to: '/admin/purchasing/receipts', text: 'Goods received', roles: ['buyer', 'storekeeper', 'finance'] },
  { to: '/admin/purchasing/costing', text: 'Costing', roles: ['finance'] },
  { to: '/admin/purchasing/suppliers', text: 'Suppliers', roles: ['requester', 'buyer'] },
];

export const staffPages = (access) => STAFF_PAGES.filter(p => p.roles.some(r => hasRole(access, r)));

export const pageRoles = (prefix) => STAFF_PAGES.find(p => p.to === prefix).roles;

/** Only approves: sees nothing but requisitions waiting for approval */
export const isApproverOnly = (access) => Boolean(access && !access.full && access.roles?.length === 1 && access.roles[0] === 'approver');

/** Whether `pathname` is open to this user (full access opens everything) */
export const canOpenPage = (access, pathname) => Boolean(access) && (access.full
  || staffPages(access).some(p => pathname === p.to || pathname.startsWith(`${p.to}/`)));

/** Keeps known roles only, once each; null stays null (full access) */
export function cleanRoles(roles) {
  if (roles == null) return null;
  return ROLE_IDS.filter(id => roles.includes(id));
}
