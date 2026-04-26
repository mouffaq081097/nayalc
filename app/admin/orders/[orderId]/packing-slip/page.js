// app/admin/orders/[orderId]/packing-slip/page.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import PrintButton from './PrintButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function fetchOrder(orderId) {
 const client = await db.connect();
 try {
 const orderSql = (table) => `
 SELECT
 o.id, o.order_status AS status, o.created_at AS "createdAt",
 o.total_amount AS "totalAmount", o.discount_amount AS "discountAmount",
 o.shipping_cost AS "shippingCost", o.gift_wrap_cost AS "giftWrapCost",
 o.subtotal,
 COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS "customerName",
 COALESCE(u.email, '') AS "customerEmail",
 ua.customer_phone AS "customerPhone",
 ua.address_line1 AS "addressLine1",
 ua.address_line2 AS "addressLine2",
 ua.city, ua.country, ua.zip_code AS "zipCode",
 o.payment_method AS "paymentMethod"
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
 #packing-slip * { box-sizing: border-box; margin: 0; padding: 0; }

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
 text-transform: ;
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
 text-transform: ;
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
 text-transform: ;
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

 const numericId = parseInt(orderId, 10);
 if (isNaN(numericId)) redirect('/admin/orders');

 const session = await getServerSession(authOptions);
 if (!session || session.user?.role !== 'admin') {
 redirect('/auth');
 }

 const order = await fetchOrder(numericId);

 if (!order) {
 return (
 <>
 <link
 rel="stylesheet"
 href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap"
 />
 <style dangerouslySetInnerHTML={{ __html: css }} />
 <div id="packing-slip">
 <div className="slip-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
 <p style={{ color: '#9333ea', fontWeight: 600 }}>Order #{numericId} not found.</p>
 <Link href="/admin/orders" style={{ fontSize: '12px', color: '#6b21a8', textDecoration: 'underline' }}>← Back to orders</Link>
 </div>
 </div>
 </>
 );
 }

 const placedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
 year: 'numeric', month: 'long', day: 'numeric',
 });

 return (
 <>
 <link
 rel="stylesheet"
 href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap"
 />
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

 {/* Cancelled warning */}
 {order.status?.toLowerCase() === 'cancelled' && (
 <div style={{ marginBottom: '20px', padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '12px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em', textTransform: '' }}>
 ⚠ This order was cancelled
 </div>
 )}

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
 {order.paymentMethod && (
 <p>Payment: {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}</p>
 )}
 </div>
 </div>

 {/* Items table */}
 <table className="items-table">
 <thead>
 <tr>
 <th>Product</th>
 <th>Brand</th>
 <th className="center">Qty</th>
 </tr>
 </thead>
 <tbody>
 {order.items.map((item, idx) => (
 <tr key={idx}>
 <td><div className="item-name">{item.name}</div></td>
 <td><div className="item-brand">{item.brandName || 'Naya Lumière'}</div></td>
 <td className="center">{item.quantity}</td>
 </tr>
 ))}
 </tbody>
 </table>

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
