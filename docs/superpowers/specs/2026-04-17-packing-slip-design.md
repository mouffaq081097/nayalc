# Packing Slip — Design Spec
**Date:** 2026-04-17
**Status:** Approved

## Overview

Add a "Print packing slip" button to the admin order detail page (`/admin/orders/[orderId]`). Clicking it opens a new browser tab at `/admin/orders/[orderId]/packing-slip`, which renders a lavender-themed, print-optimized full packing slip. The user prints or saves as PDF via the browser's native print dialog.

No new npm dependencies. Zero API round-trips from the packing slip page — data is fetched server-side directly from the DB.

---

## Route

**New file:** `app/admin/orders/[orderId]/packing-slip/page.js`

- Server component (no `'use client'`)
- Receives `params.orderId` from the Next.js App Router
- Queries the DB directly (reuses the same multi-table lookup logic as `/api/orders/[orderId]` GET — checks `orders`, then `delivered_orders`, then `cancelled_orders`)
- Returns 404 if order not found
- Must check session server-side via NextAuth's `getServerSession`. If no session or `session.user.email !== 'mouffaq@nayalc.com'`, redirect to `/auth/login`. (Existing admin pages rely on `useAuth()` client-side; server components must gate independently.)

---

## Trigger (existing page change)

**File:** `app/admin/orders/[orderId]/page.js`

The existing "Export invoice" button row gains a second button:

```
[ Export invoice ]  [ Print packing slip ↗ ]  [ Message client ]
```

"Print packing slip" uses an `<a href={`/admin/orders/${orderId}/packing-slip`} target="_blank" rel="noopener noreferrer">` styled as a ghost lavender button (`border-purple-200 text-purple-600 hover:bg-purple-50`).

---

## Packing Slip Layout

Full-page lavender-themed document. All colors use explicit hex values (not CSS variables) so they survive PDF rendering.

### 1. Header
- Naya Lumière Cosmetics logo (`/Adobe Express - file (5).png`) — 48px tall, left-aligned
- Brand name: two-line, matching email/navbar style
  - Line 1: "NAYA" — bold uppercase, `#3b0764`, font-black, Montserrat
  - Line 2: "Lumière Cosmetics" — Georgia italic, `#6b21a8`
- Right side: "PACKING SLIP" label in lavender gradient text (`#9333ea → #db2777`), order number (`#Order 1234`), and date placed
- Separator: 2px lavender gradient rule below header

### 2. Info row (two columns)
| Left | Right |
|---|---|
| **Ship to** label (`text-purple-400`, small caps) | **Customer** label |
| Full shipping address (line1, line2, city, country) | Name, email, phone |

Background: `#f8f0ff` (lavender tint), rounded, border `rgba(216,180,254,0.35)`

### 3. Items table
- Header row: `background: #f3e8ff`, `color: #7e22ce`, font-semibold
- Columns: **Product** / **Brand** / **Qty** / **Unit price** / **Line total**
- Alternating rows: white / `#faf5ff`
- Row borders: `1px solid #f3e8ff`
- Product name: `#1a1a1a`, font-medium. Brand: `#9333ea`, small, font-medium.
- Prices right-aligned, `#3b0764`, font-semibold

### 4. Order summary
Right-aligned below the table, max-width ~280px:
- Subtotal
- Discount (hidden if 0)
- Shipping
- Gift wrap (hidden if 0)
- **Total** — bold, larger, `#3b0764`

Background: `#f8f0ff`, rounded, border `rgba(216,180,254,0.35)`, padding `16px 20px`

### 5. Footer
- Thin `1px solid #e9d5ff` rule
- "Thank you for your order with Naya Lumière Cosmetics"
- `nayalc.com` · support email
- Small, centered, `color: #9333ea`

---

## Print Styling

### Screen view
- White page, centered, `max-w-3xl`, `mx-auto`, `p-8`
- "Print / Save as PDF" button fixed top-right: lavender gradient, white text, calls `window.print()`
- Page background: `#fdf8ff`

### `@media print` overrides
```css
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  @page { size: A4; margin: 20mm 15mm; }
}
```
- All lavender colors remain (explicit hex, no CSS variables)
- No shadows, no rounded corners (they don't render well in PDF)
- Table page-break-inside: avoid on rows

### Fonts
- Cormorant Garamond for the brand name header (already loaded globally)
- Montserrat for all body text (already loaded globally)
- Fallback: Georgia / sans-serif

---

## Data Fields Used

From the order query (same shape as existing GET `/api/orders/[orderId]`):

| Field | Source |
|---|---|
| `id` | order |
| `createdAt` | order |
| `status` | order |
| `customerName` | joined from users |
| `customerEmail` | joined from user_addresses |
| `customerPhone` | joined from user_addresses |
| `shippingAddress` (line1) | user_addresses.address_line1 |
| `addressLine2` | user_addresses.address_line2 |
| `city` | user_addresses.city |
| `country` | user_addresses.country |
| `items[].product.name` | products |
| `items[].product.brandName` | brands (joined) |
| `items[].quantity` | order_items |
| `items[].price` | order_items |
| `subtotal` | order |
| `discountAmount` | order |
| `shippingCost` | order |
| `giftWrapCost` | order |
| `totalAmount` | order |

Note: `brandName` is not currently returned by the order items query — the packing slip DB query must join `brands` on `products.brand_id` to get it.

---

## Out of Scope

- Barcode / QR code (no SKU data in DB)
- Batch/multi-order picking lists
- Emailing the packing slip directly
- The existing "Export invoice" button (not changed)
