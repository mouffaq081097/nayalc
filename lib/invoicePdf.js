import PDFDocument from 'pdfkit';
import { vatFromGross } from './vat.js';

// The tax invoice as a PDF (A4), with the same content as generateInvoiceHtml() in
// lib/mail.js. Built with pdfkit, so it runs on Vercel without a headless browser.
// The payment wording comes in as `paymentText` (mail.js owns that copy).

const LOGO_URL = 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
const SITE = 'nayalc.com';

const C = {
  ink: '#111114', soft: '#4b4b55', muted: '#86868f', line: '#e8e8ec', wash: '#f7f7f9',
  violet: '#9368ec', paid: '#1d7a46', paidBg: '#e9f7ef', due: '#9a5b00', dueBg: '#fff4e0',
};

const money = (n) => `AED ${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The logo is fetched once per server instance; an invoice without it beats no invoice
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

// UAE addresses have no postcode; checkout stores zeros as a placeholder
const realPostcode = (code) => (/^0*$/.test(String(code || '').trim()) ? '' : code);

const addressText = (a = {}) => [
  a.addressLine1 || a.street || a.address,
  a.addressLine2,
  [a.city, a.state].filter(Boolean).join(', '),
  [realPostcode(a.postalCode || a.zip), a.country].filter(Boolean).join(' '),
].filter((line) => line && String(line).trim()).join('\n');

/** Resolves to the PDF as a Buffer. */
export async function generateInvoicePdf(order) {
  const logo = await loadLogo();
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice INV-${order.id} — Naya Lumière Cosmetics`, Author: 'Naya Lumière Cosmetics' } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });

  const left = 48;
  const right = doc.page.width - 48;
  const width = right - left;

  // Same figures as the HTML invoice: a UAE tax invoice states the VAT even though prices include it
  const total = Number(order.totalAmount) || 0;
  const vat = Number(order.taxAmount) > 0 ? Number(order.taxAmount) : vatFromGross(total);
  const net = Math.round((total - vat) * 100) / 100;
  const isCod = order.paymentMethod === 'cashOnDelivery';
  const isPaid = !isCod || order.status === 'Delivered';
  const issued = new Date(order.createdAt || Date.now());
  const date = issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' });
  const time = issued.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai' });

  // Accent bar
  doc.rect(0, 0, doc.page.width, 6).fill(C.violet);

  // Header: logo and seller on the left, invoice number and status on the right
  let y = 40;
  if (logo) {
    try { doc.image(logo, left, y, { fit: [52, 46] }); } catch { /* unreadable image: carry on without it */ }
  }
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.ink).text('Naya Lumière Cosmetics', left, y + 54);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(`Dubai, United Arab Emirates\n${SITE}`, left, y + 71, { lineGap: 2 });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.violet).text('TAX INVOICE', left, y, { width, align: 'right', characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.ink).text(`INV-${order.id}`, left, y + 14, { width, align: 'right' });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text(`${date} · ${time}`, left, y + 40, { width, align: 'right' });

  const badge = isPaid ? 'Paid' : 'Due on delivery';
  doc.font('Helvetica-Bold').fontSize(9);
  const badgeW = doc.widthOfString(badge) + 20;
  doc.roundedRect(right - badgeW, y + 58, badgeW, 18, 9).fill(isPaid ? C.paidBg : C.dueBg);
  doc.fillColor(isPaid ? C.paid : C.due).text(badge, right - badgeW, y + 63, { width: badgeW, align: 'center' });

  // Billed to / Order
  y = 150;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(C.line).stroke();
  const colW = width / 2 - 12;
  const label = (text, x, yy) => doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text(text.toUpperCase(), x, yy, { characterSpacing: 1 });
  label('Billed to', left, y + 16);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.ink).text(String(order.customerName || 'Customer').trim() || 'Customer', left, y + 32, { width: colW });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft);
  if (order.customerEmail) doc.text(order.customerEmail, { width: colW });
  const address = addressText(order.shippingAddress);
  if (address) doc.moveDown(0.3).text(address, { width: colW, lineGap: 1.5 });
  const leftBottom = doc.y;

  const ox = left + width / 2 + 12;
  label('Order', ox, y + 16);
  let oy = y + 32;
  for (const [k, v] of [['Order number', `#${order.id}`], ['Payment', order.paymentText || 'Card'], ['Currency', 'AED']]) {
    doc.font('Helvetica').fontSize(9.5).fillColor(C.muted).text(k, ox, oy, { width: colW });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.ink).text(v, ox, oy, { width: colW, align: 'right' });
    oy += 17;
  }
  y = Math.max(leftBottom, oy) + 16;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(C.line).stroke();

  // Items
  const cols = { item: left + 10, qty: left + width * 0.58, unit: left + width * 0.66, amount: left + width * 0.83 };
  const colWidths = { item: width * 0.55, qty: width * 0.08, unit: width * 0.17 - 6, amount: width * 0.17 - 10 };
  y += 18;
  doc.rect(left, y, width, 24).fill(C.wash);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted);
  doc.text('ITEM', cols.item, y + 8, { characterSpacing: 0.8 });
  doc.text('QTY', cols.qty, y + 8, { width: colWidths.qty, align: 'center', characterSpacing: 0.8 });
  doc.text('UNIT PRICE', cols.unit, y + 8, { width: colWidths.unit, align: 'right', characterSpacing: 0.8 });
  doc.text('AMOUNT', cols.amount, y + 8, { width: colWidths.amount, align: 'right', characterSpacing: 0.8 });
  y += 24;

  for (const item of order.items || []) {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    doc.font('Helvetica').fontSize(10);
    const rowH = Math.max(doc.heightOfString(String(item.name || ''), { width: colWidths.item }), 12) + 20;
    if (y + rowH > doc.page.height - 200) { doc.addPage(); y = 48; }
    doc.fillColor(C.ink).text(String(item.name || ''), cols.item, y + 10, { width: colWidths.item });
    doc.fillColor(C.soft).text(String(qty), cols.qty, y + 10, { width: colWidths.qty, align: 'center' });
    doc.text(money(price), cols.unit, y + 10, { width: colWidths.unit, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(C.ink).text(money(price * qty), cols.amount, y + 10, { width: colWidths.amount, align: 'right' });
    y += rowH;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor(C.line).stroke();
  }

  // Totals
  y += 16;
  if (y > doc.page.height - 220) { doc.addPage(); y = 48; }
  doc.font('Helvetica').fontSize(8.5).fillColor(C.muted).text('All prices are in UAE dirhams and include VAT at 5%.', left, y, { width: width * 0.45 });

  const tx = left + width * 0.5;
  const tw = width * 0.5 - 10;
  const row = (text, value, { strong = false, colour } = {}) => {
    if (strong) {
      y += 6;
      doc.moveTo(tx, y).lineTo(right - 10, y).lineWidth(1.4).strokeColor(C.ink).stroke();
      y += 10;
    }
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 12 : 9.5).fillColor(colour || (strong ? C.ink : C.soft)).text(text, tx, y, { width: tw });
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 14 : 9.5).fillColor(colour || C.ink).text(value, tx, y - (strong ? 1 : 0), { width: tw, align: 'right' });
    y += strong ? 24 : 17;
  };
  if (order.subtotal != null) {
    row('Subtotal', money(order.subtotal));
    row('Delivery', Number(order.shippingCost) > 0 ? money(order.shippingCost) : 'Free');
  }
  if (Number(order.giftWrapCost) > 0) row('Gift wrap', money(order.giftWrapCost));
  if (Number(order.discountAmount) > 0) row('Discount', `-${money(order.discountAmount)}`, { colour: C.violet });
  row('Total', money(total), { strong: true });
  row('Net of VAT', money(net), { colour: C.muted });
  row('VAT (5%)', money(vat), { colour: C.muted });

  // Footer (inside the bottom margin, which would otherwise push it onto a new page)
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 90;
  doc.rect(0, fy, doc.page.width, 90).fill(C.wash);
  doc.font('Helvetica').fontSize(9.5).fillColor(C.soft).text('Thank you for shopping with Naya Lumière Cosmetics.', left, fy + 28, { width, align: 'center' });
  doc.fontSize(8.5).fillColor(C.muted).text(`Questions about this invoice? Reply to your order email or visit ${SITE}.`, left, fy + 44, { width, align: 'center' });

  doc.end();
  return done;
}
