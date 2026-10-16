import PDFDocument from 'pdfkit';
import { fmtMoney } from './documents.js';

// The purchase order as an A4 PDF for the supplier, styled like the tax invoice
// (lib/invoicePdf.js). Prices are in the PO's currency; nothing about our own
// costs or exchange rates goes on it.

const LOGO_URL = 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
const C = { ink: '#111114', soft: '#4b4b55', muted: '#86868f', line: '#e8e8ec', wash: '#f7f7f9', violet: '#9368ec' };

let logoCache;
async function loadLogo() {
  if (logoCache !== undefined) return logoCache;
  try {
    const res = await fetch(LOGO_URL);
    logoCache = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    logoCache = null;
  }
  return logoCache;
}

const fmtDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' })
  : '—');

/** po = getPurchaseOrder(); resolves to the PDF as a Buffer */
export async function generatePurchaseOrderPdf(po) {
  const logo = await loadLogo();
  const supplier = po.supplier || {};
  const money = (n) => fmtMoney(n, po.currency);
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `${po.number} — Naya Lumière Cosmetics`, Author: 'Naya Lumière Cosmetics' } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });

  const left = 48;
  const right = doc.page.width - 48;
  const width = right - left;

  doc.rect(0, 0, doc.page.width, 6).fill(C.violet);

  let y = 40;
  if (logo) {
    try { doc.image(logo, left, y, { fit: [52, 46] }); } catch { /* carry on without it */ }
  }
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.ink).text('Naya Lumière Cosmetics', left, y + 54);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text('Dubai, United Arab Emirates\nnayalc.com', left, y + 71, { lineGap: 2 });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.violet).text('PURCHASE ORDER', left, y, { width, align: 'right', characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.ink).text(po.number, left, y + 14, { width, align: 'right' });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(fmtDate(po.order_date), left, y + 40, { width, align: 'right' });

  // Supplier / order details
  y = 150;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(C.line).stroke();
  const colW = width / 2 - 12;
  const label = (t, x, yy) => doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text(t.toUpperCase(), x, yy, { characterSpacing: 1 });

  label('Supplier', left, y + 16);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.ink).text(supplier.name || '', left, y + 32, { width: colW });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft);
  for (const line of [supplier.contact_name, supplier.address, supplier.country, supplier.email, supplier.phone, supplier.tax_number && `Tax no. ${supplier.tax_number}`]) {
    if (line) doc.text(String(line), { width: colW, lineGap: 1.5 });
  }
  const leftBottom = doc.y;

  const ox = left + width / 2 + 12;
  label('Order', ox, y + 16);
  let oy = y + 32;
  const details = [
    ['Order date', fmtDate(po.order_date)],
    ['Deliver by', fmtDate(po.expected_date)],
    ['Currency', po.currency],
    supplier.payment_terms && ['Payment terms', supplier.payment_terms],
    po.supplier_reference && ['Your reference', po.supplier_reference],
  ].filter(Boolean);
  for (const [k, v] of details) {
    doc.font('Helvetica').fontSize(9.5).fillColor(C.muted).text(k, ox, oy, { width: colW });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.ink).text(String(v), ox, oy, { width: colW, align: 'right' });
    oy += 17;
  }
  y = Math.max(leftBottom, oy) + 16;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(C.line).stroke();

  // Lines
  const cols = { item: left + 10, qty: left + width * 0.58, unit: left + width * 0.66, amount: left + width * 0.83 };
  const colWidths = { item: width * 0.55, qty: width * 0.08, unit: width * 0.17 - 6, amount: width * 0.17 - 10 };
  const header = () => {
    doc.rect(left, y, width, 24).fill(C.wash);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted);
    doc.text('ITEM', cols.item, y + 8, { characterSpacing: 0.8 });
    doc.text('QTY', cols.qty, y + 8, { width: colWidths.qty, align: 'center', characterSpacing: 0.8 });
    doc.text('UNIT PRICE', cols.unit, y + 8, { width: colWidths.unit, align: 'right', characterSpacing: 0.8 });
    doc.text('AMOUNT', cols.amount, y + 8, { width: colWidths.amount, align: 'right', characterSpacing: 0.8 });
    y += 24;
  };
  y += 18;
  header();

  for (const item of po.items || []) {
    doc.font('Helvetica').fontSize(10);
    const rowH = Math.max(doc.heightOfString(String(item.product_name), { width: colWidths.item }), 12) + 20;
    if (y + rowH > doc.page.height - 160) { doc.addPage(); y = 48; header(); }
    doc.font('Helvetica').fontSize(10).fillColor(C.ink).text(String(item.product_name), cols.item, y + 10, { width: colWidths.item });
    doc.fillColor(C.soft).text(String(item.quantity), cols.qty, y + 10, { width: colWidths.qty, align: 'center' });
    doc.text(money(item.unit_price), cols.unit, y + 10, { width: colWidths.unit, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(C.ink).text(money(item.quantity * item.unit_price), cols.amount, y + 10, { width: colWidths.amount, align: 'right' });
    y += rowH;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor(C.line).stroke();
  }

  y += 16;
  if (y > doc.page.height - 200) { doc.addPage(); y = 48; }
  const tx = left + width * 0.5;
  const tw = width * 0.5 - 10;
  const units = (po.items || []).reduce((s, i) => s + i.quantity, 0);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(`${units} unit${units === 1 ? '' : 's'}`, tx, y, { width: tw });
  y += 20;
  doc.moveTo(tx, y).lineTo(right - 10, y).lineWidth(1.4).strokeColor(C.ink).stroke();
  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(C.ink).text('Total', tx, y, { width: tw });
  doc.fontSize(14).text(money(po.subtotal), tx, y - 1, { width: tw, align: 'right' });
  y += 34;

  if (po.notes) {
    label('Notes', left, y);
    doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(po.notes, left, y + 14, { width, lineGap: 1.5 });
  }

  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 80;
  doc.rect(0, fy, doc.page.width, 80).fill(C.wash);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft)
    .text(`Please quote ${po.number} on your invoice, packing list and delivery note.`, left, fy + 26, { width, align: 'center' });
  doc.fontSize(8.5).fillColor(C.muted).text('Naya Lumière Cosmetics · Dubai, United Arab Emirates · nayalc.com', left, fy + 42, { width, align: 'center' });

  doc.end();
  return done;
}
