// Purchasing documents — numbers, statuses and money formatting. Isomorphic.
//
//   PR  purchase requisition  draft → submitted → approved | rejected → converted (to a PO)
//   PO  purchase order        draft → sent → partially_received → received | closed; cancelled
//   GRN goods received note   draft → posted (stock in); costing open → finalized

export const docNumber = (prefix, id) => (id ? `${prefix}-${String(id).padStart(5, '0')}` : `New ${prefix}`);
export const prNumber = (id) => docNumber('PR', id);
export const poNumber = (id) => docNumber('PO', id);
export const grnNumber = (id) => docNumber('GRN', id);

// `cls` is the admin's sp-badge variant
export const PR_STATUS = {
  draft:     { label: 'Draft',     cls: 'sp-badge-neutral' },
  submitted: { label: 'Awaiting approval', cls: 'sp-badge-attention' },
  approved:  { label: 'Approved',  cls: 'sp-badge-info' },
  rejected:  { label: 'Rejected',  cls: 'sp-badge-critical' },
  converted: { label: 'Ordered',   cls: 'sp-badge-success' },
  cancelled: { label: 'Cancelled', cls: 'sp-badge-neutral' },
};

export const PO_STATUS = {
  draft:              { label: 'Draft',              cls: 'sp-badge-neutral' },
  sent:               { label: 'Sent to supplier',   cls: 'sp-badge-info' },
  partially_received: { label: 'Partially received', cls: 'sp-badge-attention' },
  received:           { label: 'Received',           cls: 'sp-badge-success' },
  closed:             { label: 'Closed',             cls: 'sp-badge-neutral' },
  cancelled:          { label: 'Cancelled',          cls: 'sp-badge-critical' },
};

export const GRN_STATUS = {
  draft:  { label: 'Draft',  cls: 'sp-badge-neutral' },
  posted: { label: 'Posted', cls: 'sp-badge-success' },
};

export const COSTING_STATUS = {
  open:      { label: 'Costing open', cls: 'sp-badge-attention' },
  finalized: { label: 'Costed',       cls: 'sp-badge-success' },
};

// Purchase orders a GRN may still be raised against
export const RECEIVABLE_PO = ['sent', 'partially_received'];

export const CURRENCIES = ['AED', 'EUR', 'USD', 'GBP', 'CHF', 'SAR'];

export const LANDED_CHARGE_KINDS = [
  { id: 'freight', label: 'Freight & shipping' },
  { id: 'customs', label: 'Customs duty & clearance' },
  { id: 'bank',    label: 'Bank & FX charges' },
  { id: 'other',   label: 'Other' },
];
export const chargeKindLabel = (id) => LANDED_CHARGE_KINDS.find(k => k.id === id)?.label || 'Other';

const round = (value, dp) => {
  const f = 10 ** dp;
  return Math.round((Number(value) || 0) * f) / f;
};
export const round2 = (v) => round(v, 2);
export const round4 = (v) => round(v, 4);

/** "EUR 1,234.50" — the currency code first, like formatAED() */
export function fmtMoney(value, currency = 'AED', { maxDigits = 2 } = {}) {
  const n = Number(value) || 0;
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDigits })}`;
}
