# Packing Slip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Print packing slip" button to the admin order detail page that opens a lavender-themed, print-ready packing slip in a new browser tab, printable/saveable as PDF via the browser's native dialog.

**Architecture:** A new Next.js server component at `app/admin/orders/[orderId]/packing-slip/page.js` fetches order data directly from the DB (checking `orders`, `delivered_orders`, and `cancelled_orders`), renders a full-page lavender packing slip, and is covered by a fixed-position overlay so the admin sidebar/header are hidden. A small `'use client'` `PrintButton` component handles the `window.print()` call. The existing order detail page gets a new anchor tag that opens the slip in a new tab.

**Tech Stack:** Next.js 15 App Router (server components), `next-auth` v4 `getServerSession`, `@vercel/postgres` raw SQL, plain CSS-in-JS via `<style dangerouslySetInnerHTML>` (no Tailwind — print CSS needs explicit hex values, not CSS variables).

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `app/admin/orders/[orderId]/packing-slip/PrintButton.js` | `'use client'` button that calls `window.print()` |
| Create | `app/admin/orders/[orderId]/packing-slip/page.js` | Server component: auth gate, DB fetch, full packing slip render |
| Modify | `app/admin/orders/[orderId]/page.js` | Add "Print packing slip" anchor button |

---

## Task 1: Create the PrintButton client component

**Files:**
- Create: `app/admin/orders/[orderId]/packing-slip/PrintButton.js`

- [ ] **Step 1: Create the file**

```jsx
// app/admin/orders/[orderId]/packing-slip/PrintButton.js
'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '10px 28px',
        borderRadius: '999px',
        border: 'none',
        background: 'linear-gradient(135deg, #a78bfa, #7e69e6)',
        color: 'white',
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 900,
        fontSize: '13px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(147,51,234,0.3)',
      }}
    >
      Print / Save as PDF
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/orders/[orderId]/packing-slip/PrintButton.js
git commit -m "feat: add PrintButton client component for packing slip"
```

---

## Task 2: Create the packing slip server page

**Files:**
- Create: `app/admin/orders/[orderId]/packing-slip/page.js`

This page:
1. Gates on admin session via `getServerSession`
2. Fetches the order from whichever table it lives in (`orders` → `delivered_orders` → `cancelled_orders`)
3. Renders a fixed-position overlay covering the admin layout, with full lavender packing slip content
4. Provides print CSS that makes only `#packing-slip` visible when printing

- [ ] **Step 1: Create the file**

```jsx
// app/admin/orders/[orderId]/packing-slip/page.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

async function fetchOrder(orderId) {
  const client = await db.connect();
  try {
    const orderSql = (table) => `
      SELECT
        o.id, o.order_status AS status, o.created_at AS "createdAt",
        o.total_amount AS "totalAmount", o.discount_amount AS "discountAmount",
        o.shipping_cost AS "shippingCost", o.gift_wrap_cost AS "giftWrapCost",
        o.subtotal, o.payment_method AS "paymentMethod",
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS "customerName",
        COALESCE(u.email, '') AS "customerEmail",
        ua.customer_phone AS "customerPhone",
        ua.address_line1 AS "addressLine1",
        ua.address_line2 AS "addressLine2",
        ua.city, ua.country, ua.zip_code AS "zipCode"
      FROM ${table} o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
      WHERE o.id = $1
    `;

    const itemsSql = (table) => `
      SELECT oi.quantity, oi.price, p.name, b.name AS "brandName"
      FROM ${table} oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE oi.order_id = $1
    `;

    const pairs = [
      ['orders', 'order_items'],
      ['delivered_orders', 'delivered_order_items'],
      ['cancelled_orders', 'cancelled_order_items'],
    ];

    for (const [orderTable, itemsTable] of pairs) {
      const res = await client.query(orderSql(orderTable), [orderId]);
      if (res.rows.length > 0) {
        const order = res.rows[0];
        const itemsRes = await client.query(itemsSql(itemsTable), [orderId]);
        return { ...order, items: itemsRes.rows };
      }
    }
    return null;
  } finally {
    client.release();
  }
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&family=Montserrat:wght@400;500;600;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  #packing-slip {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #fdf8ff;
    overflow-y: auto;
    font-family: 'Montserrat', sans-serif;
    color: #3b0764;
  }

  .slip-inner {
    max-width: 794px;
    margin: 0 auto;
    padding: 40px 40px 60px;
    background: white;
    min-height: 100vh;
  }

  .print-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 32px;
  }

  /* Header */
  .slip-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 20px;
    margin-bottom: 28px;
    border-bottom: 2px solid #9333ea;
  }

  .brand-line1 {
    font-family: 'Montserrat', sans-serif;
    font-weight: 900;
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #3b0764;
  }

  .brand-line2 {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 11px;
    color: #6b21a8;
    margin-top: 3px;
  }

  .slip-title-block { text-align: right; }

  .slip-title {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9333ea;
  }

  .slip-order-num {
    font-size: 13px;
    font-weight: 600;
    color: #6b21a8;
    margin-top: 4px;
  }

  .slip-date {
    font-size: 11px;
    color: rgba(107,33,168,0.6);
    margin-top: 2px;
  }

  /* Info row */
  .info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }

  .info-box {
    background: #f8f0ff;
    border: 1px solid rgba(216,180,254,0.35);
    border-radius: 10px;
    padding: 16px 20px;
  }

  .info-box-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9333ea;
    margin-bottom: 8px;
  }

  .info-box p { font-size: 12px; color: #3b0764; line-height: 1.7; }
  .info-box .info-name { font-weight: 700; font-size: 13px; }

  /* Items table */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 12px;
  }

  .items-table th {
    background: #f3e8ff;
    color: #7e22ce;
    font-weight: 600;
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    letter-spacing: 0.03em;
  }

  .items-table th.right,
  .items-table td.right { text-align: right; }

  .items-table th.center,
  .items-table td.center { text-align: center; }

  .items-table td {
    padding: 11px 12px;
    border-bottom: 1px solid #f3e8ff;
    color: #3b0764;
    vertical-align: top;
  }

  .items-table tr:nth-child(even) td { background: #faf5ff; }

  .item-name { font-weight: 600; color: #1a1a1a; }
  .item-brand { font-size: 10px; color: #9333ea; font-weight: 500; margin-top: 3px; }

  /* Summary */
  .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 40px; }

  .summary-box {
    background: #f8f0ff;
    border: 1px solid rgba(216,180,254,0.35);
    border-radius: 10px;
    padding: 16px 20px;
    min-width: 270px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 7px;
    color: rgba(59,7,100,0.65);
  }

  .summary-row span:last-child { font-weight: 600; color: #3b0764; }
  .summary-row .discount { color: #16a34a; }

  .summary-total {
    display: flex;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid rgba(216,180,254,0.5);
    margin-top: 6px;
    font-weight: 700;
    font-size: 16px;
    color: #3b0764;
  }

  /* Footer */
  .slip-footer {
    border-top: 1px solid #e9d5ff;
    padding-top: 20px;
    text-align: center;
  }

  .slip-footer p { font-size: 11px; color: #9333ea; line-height: 1.8; }
  .slip-footer .footer-tagline { font-weight: 600; font-size: 12px; }

  /* Print */
  @media print {
    .no-print { display: none !important; }
    body * { visibility: hidden; }
    #packing-slip, #packing-slip * { visibility: visible; }
    #packing-slip { position: fixed; inset: 0; background: white; overflow: visible; }
    .slip-inner { padding: 0; max-width: none; min-height: auto; }
    @page { size: A4; margin: 20mm 15mm; }
  }
`;

export default async function PackingSlipPage({ params }) {
  const { orderId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    redirect('/auth');
  }

  const order = await fetchOrder(orderId);

  if (!order) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div id="packing-slip">
          <div className="slip-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#9333ea', fontWeight: 600 }}>Order #{orderId} not found.</p>
          </div>
        </div>
      </>
    );
  }

  const totalAmount    = parseFloat(order.totalAmount)    || 0;
  const discountAmount = parseFloat(order.discountAmount) || 0;
  const shippingCost   = parseFloat(order.shippingCost)   || 0;
  const giftWrapCost   = parseFloat(order.giftWrapCost)   || 0;
  const subtotal = parseFloat(order.subtotal) ||
    order.items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  const placedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div id="packing-slip">
        <div className="slip-inner">

          {/* Print button */}
          <div className="print-bar no-print">
            <PrintButton />
          </div>

          {/* Header */}
          <div className="slip-header">
            <div>
              <div className="brand-line1">NAYA</div>
              <div className="brand-line2">Lumière Cosmetics</div>
            </div>
            <div className="slip-title-block">
              <div className="slip-title">Packing Slip</div>
              <div className="slip-order-num">Order #{order.id}</div>
              <div className="slip-date">Placed {placedDate}</div>
            </div>
          </div>

          {/* Info row */}
          <div className="info-row">
            <div className="info-box">
              <div className="info-box-label">Ship to</div>
              <p className="info-name">{order.customerName}</p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>{order.city}{order.zipCode ? ` ${order.zipCode}` : ''}</p>
              <p>{order.country || 'United Arab Emirates'}</p>
            </div>
            <div className="info-box">
              <div className="info-box-label">Customer</div>
              <p className="info-name">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </div>
          </div>

          {/* Items table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th className="center">Qty</th>
                <th className="right">Unit price</th>
                <th className="right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const unitPrice = parseFloat(item.price);
                return (
                  <tr key={idx}>
                    <td><div className="item-name">{item.name}</div></td>
                    <td><div className="item-brand">{item.brandName || 'Naya Lumière'}</div></td>
                    <td className="center">{item.quantity}</td>
                    <td className="right">AED {unitPrice.toFixed(2)}</td>
                    <td className="right">AED {(unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary */}
          <div className="summary-wrapper">
            <div className="summary-box">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row">
                  <span>Discount</span>
                  <span className="discount">− AED {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>AED {shippingCost.toFixed(2)}</span>
              </div>
              {giftWrapCost > 0 && (
                <div className="summary-row">
                  <span>Gift wrap</span>
                  <span>AED {giftWrapCost.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-total">
                <span>Total</span>
                <span>AED {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="slip-footer">
            <p className="footer-tagline">Thank you for your order with Naya Lumière Cosmetics</p>
            <p>nayalc.com &nbsp;·&nbsp; support@nayalc.com</p>
          </div>

        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

Run: `npm run dev`
Expected: No compilation errors in the terminal. Navigate to `/admin/orders/[any-valid-id]/packing-slip` and confirm the page loads (may redirect to `/auth` if not logged in — that's correct).

- [ ] **Step 3: Commit**

```bash
git add app/admin/orders/[orderId]/packing-slip/page.js
git commit -m "feat: add packing slip server page with lavender theme"
```

---

## Task 3: Wire up the "Print packing slip" button on the order detail page

**Files:**
- Modify: `app/admin/orders/[orderId]/page.js` (lines 1–10 for imports, lines 180–188 for the button row)

- [ ] **Step 1: Add `Printer` to the lucide-react import**

In `app/admin/orders/[orderId]/page.js`, find the existing import:

```js
import { Loader2, ArrowLeft, Package, Truck, XCircle, CheckCircle, User, MapPin, CreditCard, Receipt, Info, ShieldCheck } from 'lucide-react';
```

Replace with:

```js
import { Loader2, ArrowLeft, Package, Truck, XCircle, CheckCircle, User, MapPin, CreditCard, Receipt, Info, ShieldCheck, Printer } from 'lucide-react';
```

- [ ] **Step 2: Replace the header button row**

Find the existing button row (around line 180):

```jsx
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl px-4 py-2 text-sm font-medium text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                        Export invoice
                    </Button>
                    <Button className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
                        Message client
                    </Button>
                </div>
```

Replace with:

```jsx
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl px-4 py-2 text-sm font-medium text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                        Export invoice
                    </Button>
                    <a
                        href={`/admin/orders/${orderId}/packing-slip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-purple-600 border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                        <Printer size={14} />
                        Print packing slip
                    </a>
                    <Button className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
                        Message client
                    </Button>
                </div>
```

- [ ] **Step 3: Verify in the browser**

With the dev server running (`npm run dev`):
1. Navigate to an order detail page in the admin portal
2. Confirm the "Print packing slip" button appears between "Export invoice" and "Message client"
3. Click it — a new tab should open at `/admin/orders/[id]/packing-slip`
4. Confirm the packing slip renders: brand header, ship-to / customer info boxes, items table, summary, footer
5. Confirm the "Print / Save as PDF" button is visible on screen
6. Click "Print / Save as PDF" — the browser print dialog should open showing only the packing slip (no admin sidebar/header)
7. In the print preview, choose "Save as PDF" and confirm the output looks correct

- [ ] **Step 4: Commit**

```bash
git add app/admin/orders/[orderId]/page.js
git commit -m "feat: add Print packing slip button to admin order detail page"
```

---

## Self-Review Notes

- **Spec coverage:** Auth gate ✓, multi-table order lookup ✓, brand name from JOIN ✓, all packing slip sections ✓ (header, info row, items table, summary, footer), print CSS ✓, fixed overlay ✓, button on detail page ✓
- **No placeholders:** All code is complete and runnable
- **Type consistency:** `fetchOrder` returns `{ ...order, items }` — items have `quantity`, `price`, `name`, `brandName`. Page uses `item.brandName` consistently. `parseFloat` called on all numeric DB fields.
- **Known edge:** `subtotal` fallback computes from items if DB field is null (can happen for older orders). Discount, gift wrap rows are conditionally rendered so they don't appear as "AED 0.00".
