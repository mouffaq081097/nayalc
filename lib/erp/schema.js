import db from '../db.js';

// Purchasing tables. Created on first use by ensurePurchasingTables(), and by
// migration 015 in /api/admin/migrate. Product and user ids are plain integers
// (no foreign keys) with the product name copied onto each line, so a document
// still reads correctly after a product is renamed or deleted.

export const PURCHASING_MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS suppliers (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    contact_name  TEXT,
    email         TEXT,
    phone         TEXT,
    country       TEXT,
    address       TEXT,
    tax_number    TEXT,
    currency      CHAR(3) NOT NULL DEFAULT 'AED',
    payment_terms TEXT,
    lead_days     INTEGER,
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id            SERIAL PRIMARY KEY,
    status        TEXT NOT NULL DEFAULT 'draft',
    supplier_id   INTEGER REFERENCES suppliers(id),
    needed_by     DATE,
    notes         TEXT,
    requested_by  INTEGER,
    submitted_at  TIMESTAMPTZ,
    decided_by    INTEGER,
    decided_at    TIMESTAMPTZ,
    decision_note TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id             SERIAL PRIMARY KEY,
    requisition_id INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    product_id     INTEGER NOT NULL,
    product_name   TEXT NOT NULL,
    quantity       INTEGER NOT NULL CHECK (quantity > 0),
    note           TEXT,
    position       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id                 SERIAL PRIMARY KEY,
    status             TEXT NOT NULL DEFAULT 'draft',
    supplier_id        INTEGER NOT NULL REFERENCES suppliers(id),
    requisition_id     INTEGER REFERENCES purchase_requisitions(id),
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    exchange_rate      NUMERIC(14,6) NOT NULL DEFAULT 1,
    order_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date      DATE,
    supplier_reference TEXT,
    notes              TEXT,
    created_by         INTEGER,
    sent_by            INTEGER,
    sent_at            TIMESTAMPTZ,
    closed_at          TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                  SERIAL PRIMARY KEY,
    purchase_order_id   INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id          INTEGER NOT NULL,
    product_name        TEXT NOT NULL,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price          NUMERIC(14,4) NOT NULL DEFAULT 0,
    requisition_item_id INTEGER,
    position            INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS goods_receipts (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    status            TEXT NOT NULL DEFAULT 'draft',
    received_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    exchange_rate     NUMERIC(14,6) NOT NULL DEFAULT 1,
    supplier_invoice  TEXT,
    notes             TEXT,
    created_by        INTEGER,
    posted_by         INTEGER,
    posted_at         TIMESTAMPTZ,
    costing_status    TEXT NOT NULL DEFAULT 'open',
    costed_by         INTEGER,
    costed_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id                     SERIAL PRIMARY KEY,
    goods_receipt_id       INTEGER NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    purchase_order_item_id INTEGER NOT NULL,
    product_id             INTEGER NOT NULL,
    product_name           TEXT NOT NULL,
    quantity_received      INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_rejected      INTEGER NOT NULL DEFAULT 0 CHECK (quantity_rejected >= 0),
    unit_price             NUMERIC(14,4) NOT NULL DEFAULT 0,
    batch_number           TEXT,
    expiry_date            DATE,
    base_unit_cost         NUMERIC(14,4),
    landed_unit_cost       NUMERIC(14,4),
    position               INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS landed_cost_charges (
    id               SERIAL PRIMARY KEY,
    goods_receipt_id INTEGER NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    kind             TEXT NOT NULL DEFAULT 'other',
    description      TEXT,
    amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency         CHAR(3) NOT NULL DEFAULT 'AED',
    exchange_rate    NUMERIC(14,6) NOT NULL DEFAULT 1,
    allocation       TEXT NOT NULL DEFAULT 'value',
    position         INTEGER NOT NULL DEFAULT 0
  );

  -- Every change to a product's average cost, with the figures either side of it
  CREATE TABLE IF NOT EXISTS inventory_cost_ledger (
    id               SERIAL PRIMARY KEY,
    product_id       INTEGER NOT NULL,
    goods_receipt_id INTEGER,
    kind             TEXT NOT NULL,
    quantity         INTEGER NOT NULL DEFAULT 0,
    unit_cost        NUMERIC(14,4),
    value            NUMERIC(14,2) NOT NULL DEFAULT 0,
    expensed_value   NUMERIC(14,2) NOT NULL DEFAULT 0,
    stock_before     INTEGER,
    average_before   NUMERIC(14,4),
    average_after    NUMERIC(14,4),
    note             TEXT,
    created_by       INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS purchase_requisition_items_req_idx ON purchase_requisition_items (requisition_id);
  CREATE INDEX IF NOT EXISTS purchase_order_items_po_idx       ON purchase_order_items (purchase_order_id);
  CREATE INDEX IF NOT EXISTS goods_receipts_po_idx             ON goods_receipts (purchase_order_id);
  CREATE INDEX IF NOT EXISTS goods_receipt_items_grn_idx       ON goods_receipt_items (goods_receipt_id);
  CREATE INDEX IF NOT EXISTS landed_cost_charges_grn_idx       ON landed_cost_charges (goods_receipt_id);
  CREATE INDEX IF NOT EXISTS inventory_cost_ledger_product_idx ON inventory_cost_ledger (product_id, created_at);

  ALTER TABLE products ADD COLUMN IF NOT EXISTS average_cost NUMERIC(14,4);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS last_cost    NUMERIC(14,4);
  ALTER TABLE users    ADD COLUMN IF NOT EXISTS purchasing_roles TEXT[];

  -- Requisitions carry a price: each line's estimated unit price, in the PR's currency
  ALTER TABLE purchase_requisitions      ADD COLUMN IF NOT EXISTS currency   CHAR(3) NOT NULL DEFAULT 'AED';
  ALTER TABLE purchase_requisition_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(14,4);

  -- The email asking approvers to approve a submitted PR: when it went, or why it didn't
  ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approval_email_sent_at TIMESTAMPTZ;
  ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approval_email_error   TEXT;
`;

// Checked once per server instance
let ready = null;
export function ensurePurchasingTables() {
  ready ??= (async () => {
    const { rows } = await db.query(`
      SELECT
        to_regclass('public.inventory_cost_ledger') IS NOT NULL AS has_tables,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'purchasing_roles') AS has_roles,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_requisition_items' AND column_name = 'unit_price') AS has_pr_price,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_requisitions' AND column_name = 'approval_email_error') AS has_pr_email
    `);
    // The SQL is idempotent (IF NOT EXISTS throughout), so re-running it adds only what is missing
    if (!rows[0].has_tables || !rows[0].has_roles || !rows[0].has_pr_price || !rows[0].has_pr_email) await db.query(PURCHASING_MIGRATION_SQL);
  })().catch(error => {
    ready = null;
    throw error;
  });
  return ready;
}
