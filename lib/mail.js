import nodemailer from 'nodemailer';
import db from './db.js';
import { vatFromGross } from './vat.js';

const LOGO_URL = 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
const BASE     = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';

// ── Color tokens — match the homepage / Cloud Luxe system ─────────────────
const C = {
  bg:         '#ffffff',
  section:    '#f5f5f7',   // homepage section background
  text:       '#111114',   // homepage primary text
  sub:        '#5a5a64',   // secondary text
  muted:      '#8a8a93',   // muted / meta
  purple:     '#9333ea',
  purpleSoft: 'rgba(147,51,234,0.08)',
  divider:    '#f0f0f0',
};

const HP_FONT = "'Inter',-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif";

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls:    { rejectUnauthorized: false },
});

// ── Brand header — the lotus mark alone ───────────────────────────────────
// No wordmark: the mark carries the header on its own, at its true 405:352
// proportions. Most clients block images by default, so the alt text has to
// stand in for the brand name that used to sit beside it.
const brandHeader = `<img src="${LOGO_URL}" alt="Naya Lumi&egrave;re Cosmetics" width="46" height="40" style="display:block;width:46px;height:40px;border:0;outline:none;text-decoration:none;">`;

// ── Flat white email wrapper — no container borders or rounded corners ─────
const emailWrapper = (content, title, preheader = '', { topBar = '', header = '', hero = '' } = {}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <!--[if mso]><style>body,table,td,p,a,span,div{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
  <style>
    body{font-family:'Inter',-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;color:${C.text};background-color:${C.bg};margin:0;padding:0;-webkit-font-smoothing:antialiased;}
    .wrap{width:100%;max-width:600px;margin:0 auto;background:${C.bg};}
    .hdr{padding:16px 40px 12px;background:${C.bg};}
    .body{padding:20px 40px 40px;}
    h2{font-size:24px;font-weight:800;color:${C.text};margin:0 0 16px;letter-spacing:-0.02em;line-height:1.2;}
    h3{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${C.muted};margin:32px 0 12px;}
    p{font-size:15px;color:${C.sub};margin:0 0 14px;line-height:1.7;}
    .btn{display:inline-block;background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230));color:#ffffff!important;padding:14px 32px;text-decoration:none;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;margin-top:24px;}
    .box{background:${C.section};padding:24px;margin:24px 0;}
    .row{display:flex;justify-content:space-between;font-size:14px;color:${C.sub};margin-bottom:8px;}
    .total{font-size:17px;font-weight:900;color:${C.text};padding-top:14px;margin-top:6px;border-top:1px solid ${C.divider};display:flex;justify-content:space-between;}
    table{width:100%;border-collapse:collapse;margin:16px 0;}
    th{text-align:left;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};padding-bottom:10px;border-bottom:1px solid ${C.divider};font-weight:800;}
    td{padding:14px 0;border-bottom:1px solid ${C.divider};font-size:14px;color:${C.sub};}
    .ftr{text-align:center;font-size:11px;color:${C.muted};padding:36px 40px;background:${C.section};}
    .ftr a{color:${C.purple};text-decoration:none;font-weight:700;}
    @media only screen and (max-width:480px){.hdr{padding:14px 20px 10px!important;}.body{padding:16px 20px 32px!important;}.ftr{padding:28px 20px!important;}.hide-mobile{display:none!important;}.hero-pad{padding:48px 20px 28px!important;}.hero-title{font-size:36px!important;}.pc-img{padding:10px 10px 0!important;}.pc-body{padding:10px 8px 12px!important;}.pc-brand{font-size:9px!important;letter-spacing:0.06em!important;}.pc-name{font-size:11px!important;letter-spacing:0.02em!important;}}
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>` : ''}
  <div class="wrap">
    ${topBar}
    <div class="hdr">${header || brandHeader}</div>
    ${hero}
    <div class="body">${content}</div>
    <div class="ftr">
      <p style="margin:0 0 8px;font-size:11px;color:${C.muted};">&copy; ${new Date().getFullYear()} Naya Lumière Cosmetics. All rights reserved.</p>
      <p style="margin:0 0 8px;"><a href="${BASE}/privacy">Privacy Policy</a> &nbsp;·&nbsp; <a href="${BASE}/terms">Terms</a> &nbsp;·&nbsp; <a href="${BASE}">Shop</a></p>
      <p style="margin:0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${C.divider};">Geneva &nbsp;·&nbsp; Dubai &nbsp;·&nbsp; Paris</p>
    </div>
  </div>
</body>
</html>
`;

// ── Live product suggestions ───────────────────────────────────────────────
async function fetchProductsForEmail(limit = 3) {
  try {
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.price,
             COALESCE(b.name, 'Naya Lumière') AS brand_name,
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.stock_quantity > 0
      ORDER BY RANDOM()
      LIMIT $1
    `, [limit]);
    return rows;
  } catch {
    return [];
  }
}

// Builds the product suggestion strip — table-based for email clients
function productSuggestionBlock(products, sectionTitle) {
  if (!products || products.length === 0) return '';

  const cardWidth = Math.floor(520 / products.length) - 12;

  const cards = products.map(p => {
    const img   = p.image_url || `${BASE}/placeholder-image.jpg`;
    const price = `AED ${Number(p.price).toFixed(0)}`;
    const name  = p.name.length > 36 ? p.name.slice(0, 34) + '…' : p.name;
    const url   = `${BASE}/product/${p.id}`;
    return `<td style="width:${cardWidth}px; vertical-align:top; padding:0 6px;"><a href="${url}" style="display:block; text-decoration:none; color:inherit;"><div style="background:#ffffff; overflow:hidden;"><img src="${img}" alt="${name}" width="${cardWidth}" height="148" style="display:block; width:${cardWidth}px; height:148px; object-fit:contain; background:#ffffff; padding:10px; box-sizing:border-box;"><div style="background:#ffffff; padding:10px 8px 12px;"><p style="font-size:9px; font-weight:700; color:${C.muted}; margin:0 0 3px; text-transform:uppercase; letter-spacing:0.1em;">${p.brand_name}</p><p style="font-size:12px; font-weight:600; color:${C.text}; margin:0 0 5px; line-height:1.3;">${name}</p><p style="font-size:13px; font-weight:800; color:${C.purple}; margin:0;">${price}</p></div></div></a></td>`;
  }).join('');

  return `
    <div style="background:${C.section}; margin:40px -40px -40px; padding:36px 40px;">
      <p style="font-size:10px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:${C.muted}; margin:0 0 4px;">For You</p>
      <h2 style="font-size:20px; font-weight:800; color:${C.text}; margin:0 0 24px; letter-spacing:-0.01em;">${sectionTitle}</h2>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>${cards}</tr>
      </table>
      <div style="text-align:center; margin-top:24px;">
        <a href="${BASE}/all-products" style="display:inline-block; font-size:11px; font-weight:700; color:${C.purple}; text-decoration:none; letter-spacing:0.08em; text-transform:uppercase;">View All Products &rarr;</a>
      </div>
    </div>`;
}

const formatShippingCost = (cost) => {
  if (!cost || isNaN(cost) || Number(cost) === 0) return 'Free';
  return `AED ${Number(cost).toFixed(2)}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED ORDER-EMAIL COMPONENTS
// The customer confirmation and the admin fulfilment alert are built from the
// same parts, so the two stay in step. Tables throughout — the markup these
// replaced used `display:flex` rows, which Outlook's Word engine ignores, so
// the totals collapsed into a single column there.
// ═══════════════════════════════════════════════════════════════════════════

const money = (value) => `AED ${Number(value || 0).toFixed(2)}`;

const dubaiTime = (value) => new Date(value || Date.now()).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai',
});

// Purple strip above the header, mirroring the site's promo bar
const topBarStrip = (label) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;"><tr>
      <td align="center" bgcolor="${HP.promoStart}" style="background-color:${HP.promoStart};background-image:linear-gradient(90deg,${HP.promoStart} 0%,${HP.promoEnd} 100%);padding:10px 16px;border-bottom:none;font-family:${HP_FONT};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;line-height:1.6;">${label}</td>
    </tr></table>`;

// Label/value pair in a snapshot; skipped entirely when there's no value
const infoRow = (label, value) => value ? `
      <tr>
        <td width="120" style="width:120px;padding:10px 0;border-bottom:1px solid ${C.divider};font-family:${HP_FONT};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${C.muted};vertical-align:top;line-height:1.6;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.divider};font-family:${HP_FONT};font-size:14px;color:${C.text};vertical-align:top;line-height:1.6;">${value}</td>
      </tr>` : '';

const infoTable = (rows) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;border-collapse:collapse;">${rows.join('')}</table>`;

// Totals line; `strong` marks the final total row
const totalRow = (label, value, { strong = false, accent = null } = {}) => `
      <tr>
        <td style="padding:${strong ? '12px 0 0' : '5px 0'};${strong ? `border-top:1px solid ${C.divider};` : ''}font-family:${HP_FONT};font-size:${strong ? '15px' : '13px'};font-weight:${strong ? '800' : '400'};color:${accent || (strong ? C.text : C.sub)};line-height:1.6;">${label}</td>
        <td align="right" style="padding:${strong ? '12px 0 0' : '5px 0'};${strong ? `border-top:1px solid ${C.divider};` : ''}font-family:${HP_FONT};font-size:${strong ? '15px' : '13px'};font-weight:${strong ? '900' : '600'};color:${accent || C.text};text-align:right;line-height:1.6;">${value}</td>
      </tr>`;

// Quantity, product and line total. `meta` adds the unit price and product id
// the fulfilment team needs; the customer copy leaves it off.
const lineItemsTable = (items, { meta = false } = {}) => {
  if (!items || items.length === 0) return '';
  const rows = items.map(item => {
    const quantity  = Number(item.quantity || 0);
    const unitPrice = Number(item.price || 0);
    return `
      <tr>
        <td width="44" style="width:44px;padding:13px 0;border-bottom:1px solid ${C.divider};font-family:${HP_FONT};font-size:14px;font-weight:900;color:${C.text};vertical-align:top;line-height:1.5;">${quantity}&times;</td>
        <td style="padding:13px 0;border-bottom:1px solid ${C.divider};font-family:${HP_FONT};font-size:14px;color:${C.text};vertical-align:top;line-height:1.5;">
          <div style="font-weight:700;">${escapeHtml(item.name || 'Unknown product')}</div>
          <div style="font-size:11px;color:${C.muted};margin-top:2px;">${meta ? `ID ${escapeHtml(item.productId ?? '—')} &middot; ` : ''}${money(unitPrice)} each</div>
        </td>
        <td align="right" style="padding:13px 0;border-bottom:1px solid ${C.divider};font-family:${HP_FONT};font-size:14px;font-weight:700;color:${C.text};text-align:right;vertical-align:top;line-height:1.5;">${money(unitPrice * quantity)}</td>
      </tr>`;
  }).join('');

  const th = (label, align = 'left') =>
    `<th align="${align}" style="text-align:${align};font-family:${HP_FONT};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};font-weight:800;padding-bottom:10px;border-bottom:1px solid ${C.divider};">${label}</th>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0 0;border-collapse:collapse;">
      <thead><tr>${th('Qty')}${th('Product')}${th('Line total', 'right')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

// The breakdown renders only when a subtotal was supplied; otherwise this
// collapses to the single total row.
const orderTotalsTable = ({ subtotal, shippingCost, giftWrapCost, taxAmount, discountAmount, couponCode, total }) => {
  const hasBreakdown = subtotal != null;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;border-collapse:collapse;">
      ${hasBreakdown ? totalRow('Subtotal', money(subtotal)) : ''}
      ${hasBreakdown ? totalRow('Shipping', formatShippingCost(shippingCost)) : ''}
      ${Number(giftWrapCost) > 0 ? totalRow('Gift wrap', money(giftWrapCost)) : ''}

      ${Number(discountAmount) > 0 ? totalRow(`Discount${couponCode ? ` (${escapeHtml(couponCode)})` : ''}`, `&minus;${money(discountAmount)}`, { accent: HP.violet }) : ''}
      ${totalRow('Order total', money(total), { strong: true })}
      ${Number(taxAmount) > 0 ? `
      <tr>
        <td colspan="2" align="right" style="padding:4px 0 0;font-family:${HP_FONT};font-size:11px;color:${C.muted};text-align:right;line-height:1.6;">Includes VAT of ${money(taxAmount)}</td>
      </tr>` : ''}
    </table>`;
};

const addressBlock = (address = {}) => {
  const lines = [
    address.street,
    [address.city, address.zip].filter(Boolean).join(', '),
    address.state,
    address.country,
  ].filter(Boolean).map(line => escapeHtml(line)).join('<br>');
  return `
    <div class="box" style="font-size:14px; color:${C.sub}; line-height:1.8;">
      ${lines || 'No address on file.'}
    </div>`;
};

// One definition per payment method, worded for whoever is reading it: the
// packer needs to know whether to collect money, the customer whether they
// still owe any.
const PAYMENT_COPY = {
  cashOnDelivery: {
    label: 'Cash on delivery', tone: 'cod',
    admin: 'Collect payment on handover',
    customer: 'Please have the exact amount ready for the courier',
  },
  card: {
    label: 'Card', tone: 'paid',
    admin: 'Paid online',
    customer: 'Paid in full — nothing to pay on delivery',
  },
  tabby: {
    label: 'Tabby · Pay in 4', tone: 'paid',
    admin: 'Paid by Tabby · settled to us in full',
    customer: 'Split into 4 interest-free payments, managed in your Tabby app',
  },
};

const PAYMENT_TONES = {
  cod:     { bg: '#fffbeb', ink: '#92400e', line: '#fde68a' },
  paid:    { bg: '#ecfdf5', ink: '#065f46', line: '#a7f3d0' },
  unknown: { bg: C.section, ink: C.sub,     line: C.divider },
};

// The four Tabby instalments, so the customer can see the schedule at a glance
const tabbySchedule = (total, ink, line) => {
  const each = money(Number(total) / 4);
  const when = ['Today', 'In 1 month', 'In 2 months', 'In 3 months'];
  return `
        <div style="margin-top:14px;border-top:1px solid ${line};padding-top:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
            ${when.map(label => `<td width="25%" align="center" style="width:25%;padding:2px;font-family:${HP_FONT};font-size:11px;color:${ink};text-align:center;line-height:1.5;">${label}<br><strong style="font-weight:800;">${each}</strong></td>`).join('')}
          </tr></table>
        </div>`;
};

/**
 * The loudest block in either order email: is there money still to move?
 * `audience` picks the wording — 'admin' or 'customer'.
 */
const paymentBanner = (paymentMethod, total, audience) => {
  const payment = PAYMENT_COPY[paymentMethod]
    || (paymentMethod ? { label: paymentMethod, tone: 'unknown', admin: '', customer: '' } : null);
  const tone = PAYMENT_TONES[payment?.tone || 'unknown'];

  const fallback = audience === 'admin'
    ? 'Check the order in admin before dispatch'
    : 'We will confirm your payment shortly';

  const detail = payment?.tone === 'cod' && audience === 'admin'
    ? `Collect <strong style="font-weight:900;">${money(total)}</strong> on handover`
    : payment?.tone === 'cod'
      ? `Please have <strong style="font-weight:900;">${money(total)}</strong> ready for the courier`
      : escapeHtml(payment?.[audience] || fallback);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 28px;border-collapse:collapse;"><tr>
      <td style="background-color:${tone.bg};border:1px solid ${tone.line};border-left:4px solid ${tone.ink};padding:16px 20px;font-family:${HP_FONT};">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${tone.ink};line-height:1.5;">${escapeHtml(payment ? payment.label : 'Payment method not recorded')}</div>
        <div style="font-size:14px;color:${tone.ink};margin:5px 0 0;line-height:1.5;">${detail}</div>
        ${paymentMethod === 'tabby' && audience === 'customer' ? tabbySchedule(total, tone.ink, tone.line) : ''}
      </td>
    </tr></table>`;
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function sendWelcomeEmail(email, firstName) {
  try {
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Welcome, ${firstName}</h2>
      <p>Your account is live. You now have full access to Naya Lumière's clinical botanical collections, AI skin consultations, and your personal rewards sanctuary.</p>
      <p>500 prestige points have been added to your account as a welcome gift.</p>
      <a href="${BASE}" class="btn">Begin Your Ritual</a>
      ${productSuggestionBlock(products, 'Begin Your Ritual')}
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Naya Lumière — Your sanctuary is ready',
      html: emailWrapper(content, 'Welcome'),
    });
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false };
  }
}

export async function sendLoginConfirmationEmail(email, firstName) {
  try {
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Hello, ${firstName}</h2>
      <p>A successful sign-in to your Naya Lumière account was just recorded.</p>
      <p>If this wasn't you, secure your account immediately by changing your password.</p>
      <a href="${BASE}/account" class="btn">Manage Account</a>
      ${productSuggestionBlock(products, 'Your Ritual Continues')}
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Sign-in confirmed — Naya Lumière',
      html: emailWrapper(content, 'Sign-in Confirmed'),
    });
    return { success: true };
  } catch (error) {
    console.error('Login email error:', error);
    return { success: false };
  }
}

/**
 * Builds the customer order confirmation. Split from the send so it can be
 * previewed without SMTP, as the fulfilment alert is.
 */
export function buildOrderConfirmationEmail(
  firstName, orderId, total_amount, taxAmount, discountAmount, subtotal,
  shippingCost, itemsWithDetails = [], shippingAddress, giftWrapCost,
  couponCode = null, paymentMethod = null, placedAt = null, suggestions = []
) {
  const address   = shippingAddress || {};
  const unitCount = itemsWithDetails.reduce((count, item) => count + Number(item.quantity || 0), 0);

  const content = `
      <h2>Thank you, ${escapeHtml(firstName || 'there')}</h2>
      <p>Order <strong style="color:${C.text};">#${escapeHtml(orderId)}</strong> is confirmed and we're preparing it now. We'll email you again the moment it ships.</p>

      ${paymentBanner(paymentMethod, total_amount, 'customer')}

      <h3>Order snapshot</h3>
      ${infoTable([
        infoRow('Order', `<strong style="font-weight:800;">#${escapeHtml(orderId)}</strong>`),
        infoRow('Placed', `${escapeHtml(dubaiTime(placedAt))} <span style="color:${C.muted};">Dubai time</span>`),
        infoRow('Items', unitCount ? `${unitCount} item${unitCount === 1 ? '' : 's'}` : ''),
      ])}

      ${itemsWithDetails.length ? '<h3>Your order</h3>' : ''}
      ${lineItemsTable(itemsWithDetails)}

      <h3>Totals</h3>
      ${orderTotalsTable({
        subtotal, shippingCost, giftWrapCost, taxAmount,
        discountAmount, couponCode, total: total_amount,
      })}

      <h3>Delivering to</h3>
      ${addressBlock(address)}

      <div style="margin-top:32px;">${solidButton(`${BASE}/account/orders/${orderId}`, 'Track your order')}</div>
      ${productSuggestionBlock(suggestions, 'Complete the look')}
    `;

  const preheader = [
    unitCount ? `${unitCount} item${unitCount === 1 ? '' : 's'} on the way` : 'Order confirmed',
    money(total_amount),
    address.city,
  ].filter(Boolean).join(' · ');

  return {
    subject: `Order #${orderId} confirmed — Naya Lumière`,
    html: emailWrapper(content, `Order #${orderId} confirmed`, preheader, {
      topBar: topBarStrip('Order confirmed'),
    }),
  };
}

export async function sendOrderConfirmationEmail(
  email, firstName, orderId, total_amount, taxAmount,
  discountAmount, subtotal, shippingCost, itemsWithDetails,
  shippingAddress, giftWrapCost, couponCode = null, paymentMethod = null, placedAt = null
) {
  try {
    const suggestions = await fetchProductsForEmail(3);
    const { subject, html } = buildOrderConfirmationEmail(
      firstName, orderId, total_amount, taxAmount, discountAmount, subtotal,
      shippingCost, itemsWithDetails, shippingAddress, giftWrapCost,
      couponCode, paymentMethod, placedAt, suggestions
    );
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Order email error:', error);
    return { success: false };
  }
}

// ── Admin fulfilment alert ────────────────────────────────────────────────
// Internal email: no marketing, no product suggestions. Everything needed to
// pick, pack and hand the order over should be readable without opening admin.

// Order alerts go to ORDER_NOTIFICATION_EMAILS (comma separated) so the whole
// fulfilment team can be copied, falling back to the single ADMIN_EMAIL.
const resolveAdminRecipients = (explicit) => String(
  explicit || process.env.ORDER_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL || ''
).split(',').map(address => address.trim()).filter(Boolean);

/**
 * Builds the fulfilment alert. Split from the send so it can be previewed and
 * asserted on without touching SMTP, as buildStockClearanceEmail is.
 * `details` is optional — older call sites pass the positional arguments alone
 * and simply get a thinner email.
 */
export function buildAdminNotificationEmail(orderId, customerEmail, total_amount, shippingAddress, details = {}) {
    const {
      customerName, customerPhone, paymentMethod, items = [],
      subtotal, shippingCost, taxAmount, discountAmount, giftWrapCost,
      couponCode, placedAt,
    } = details;

    const address   = shippingAddress || {};
    const unitCount = items.reduce((count, item) => count + Number(item.quantity || 0), 0);

    const contactLine = [
      customerName ? `<strong style="font-weight:700;">${escapeHtml(customerName)}</strong>` : null,
      customerEmail && customerEmail !== 'Unknown'
        ? `<a href="mailto:${encodeURI(String(customerEmail))}" style="color:${HP.violet};text-decoration:none;">${escapeHtml(customerEmail)}</a>`
        : null,
    ].filter(Boolean).join('<br>');

    const content = `
      <h2>Order #${escapeHtml(orderId)} needs fulfilment</h2>
      <p>${escapeHtml(customerName || 'A customer')} placed an order for <strong style="color:${C.text};">${money(total_amount)}</strong>. Everything needed to pick and pack it is below.</p>

      ${paymentBanner(paymentMethod, total_amount, 'admin')}

      <h3>Order snapshot</h3>
      ${infoTable([
        infoRow('Order', `<strong style="font-weight:800;">#${escapeHtml(orderId)}</strong>`),
        infoRow('Placed', `${escapeHtml(dubaiTime(placedAt))} <span style="color:${C.muted};">Dubai time</span>`),
        infoRow('Customer', contactLine),
        infoRow('Phone', customerPhone
          ? `<a href="tel:${encodeURI(String(customerPhone).replace(/\s+/g, ''))}" style="color:${HP.violet};text-decoration:none;font-weight:700;">${escapeHtml(customerPhone)}</a>`
          : ''),
        infoRow('To pack', unitCount ? `${unitCount} unit${unitCount === 1 ? '' : 's'} across ${items.length} line${items.length === 1 ? '' : 's'}` : ''),
      ])}

      ${items.length ? '<h3>Items to pack</h3>' : ''}
      ${lineItemsTable(items, { meta: true })}

      <h3>Totals</h3>
      ${orderTotalsTable({
        subtotal, shippingCost, giftWrapCost, taxAmount,
        discountAmount, couponCode, total: total_amount,
      })}

      <h3>Ship to</h3>
      ${addressBlock(address)}

      <div style="margin-top:32px;">${solidButton(`${BASE}/admin/orders/${orderId}`, 'Open order in admin')}</div>
    `;

    const payment = PAYMENT_COPY[paymentMethod] || (paymentMethod ? { label: paymentMethod } : null);
    const subjectBits = [`Action required: order #${orderId}`, money(total_amount)];
    if (payment) subjectBits.push(payment.label);

    const preheader = [
      unitCount ? `${unitCount} unit${unitCount === 1 ? '' : 's'} to pack` : 'New order',
      money(total_amount),
      payment?.label,
      address.city,
    ].filter(Boolean).join(' · ');

    return {
      subject: subjectBits.join(' · '),
      html: emailWrapper(content, `New order #${orderId}`, preheader, {
        topBar: topBarStrip('Action required · New order'),
      }),
    };
}

export async function sendAdminNotificationEmail(adminEmail, orderId, customerEmail, total_amount, shippingAddress, details = {}) {
  try {
    const recipients = resolveAdminRecipients(adminEmail);
    if (recipients.length === 0) {
      console.warn(`Order #${orderId}: no admin recipient configured — set ORDER_NOTIFICATION_EMAILS or ADMIN_EMAIL.`);
      return { success: false, skipped: true };
    }

    const { subject, html } = buildAdminNotificationEmail(orderId, customerEmail, total_amount, shippingAddress, details);

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Admin order notification error:', error);
    return { success: false };
  }
}

export async function sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, latestMessageContent) {
  try {
    const content = `
      <h2>New Message from ${customerName}</h2>
      <p>A client has sent a message through the specialist chat portal.</p>
      <div style="background:${C.section}; padding:20px 24px; margin:24px 0; border-left:3px solid rgb(196,167,254); font-style:italic; color:${C.sub}; font-size:15px; line-height:1.7;">
        "${latestMessageContent}"
      </div>
      <p>Client: <strong style="color:${C.purple};">${customerEmail}</strong></p>
      <a href="${BASE}/admin/chat/${conversationId}" class="btn">Respond Now</a>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New message from ${customerName} — Naya Lumière`,
      html: emailWrapper(content, 'New Message'),
    });
    return { success: true };
  } catch (error) {
    console.error('Chat notification error:', error);
    return { success: false };
  }
}

export async function sendSubscriptionConfirmationEmail(email) {
  try {
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>You're in the Circle</h2>
      <p>Welcome to the Lumière Club — exclusive access to launches, restocks, and bespoke beauty rituals delivered directly to your inbox.</p>
      <div class="box">
        <div class="row"><span>Exclusive member offers</span><span style="color:${C.purple}; font-weight:700;">20% off</span></div>
        <div class="row"><span>Early launch access</span><span style="color:${C.purple}; font-weight:700;">Avant-première</span></div>
        <div class="row"><span>Skin consultations</span><span style="color:${C.purple}; font-weight:700;">Complimentary</span></div>
      </div>
      <a href="${BASE}" class="btn">Explore the Collection</a>
      ${productSuggestionBlock(products, 'Your First Discovery')}
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to the Lumière Circle',
      html: emailWrapper(content, 'Subscription Confirmed'),
    });
    return { success: true };
  } catch (error) {
    console.error('Subscription email error:', error);
    return { success: false };
  }
}

export async function sendOrderStatusUpdateEmail(
  email, firstName, orderId, newStatus, cancellationReason,
  _totalAmount, _taxAmount, _discountAmount, _subtotal, _shippingCost,
  _itemsWithDetails, _shippingAddress, trackingNumber, courierName,
  courierWebsite, orderDetails, pointsEarned
) {
  try {
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Order #${orderId} is ${newStatus}</h2>
      <p>Hi ${firstName}, your order status has been updated.</p>

      <div class="box">
        <div class="row"><span>Status</span><span style="font-weight:700; color:${C.text};">${newStatus}</span></div>
        ${newStatus === 'Cancelled' && cancellationReason ? `<div class="row"><span>Reason</span><span>${cancellationReason}</span></div>` : ''}
        ${trackingNumber ? `<div class="row"><span>Tracking No.</span><span style="font-weight:700;">${trackingNumber}</span></div>` : ''}
        ${courierName ? `<div class="row"><span>Courier</span><span>${courierName}${courierWebsite ? ` — <a href="${courierWebsite}" style="color:${C.purple};">Track</a>` : ''}</span></div>` : ''}
      </div>

      ${newStatus === 'Delivered' && pointsEarned ? `
      <div style="background:${C.purpleSoft}; padding:20px 24px; margin:24px 0; text-align:center;">
        <p style="margin:0; font-size:15px; font-weight:700; color:${C.text};">You earned <strong style="color:${C.purple}; font-size:18px;">${pointsEarned} pts</strong> on this order</p>
        <p style="margin:8px 0 0; font-size:12px; color:${C.muted};">Redeemable on your next purchase.</p>
      </div>` : ''}

      <a href="${BASE}/account/orders" class="btn">View Order Details</a>
      ${productSuggestionBlock(products, 'Refresh Your Ritual')}
    `;
    const invoiceHtml = generateInvoiceHtml(orderDetails);
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order #${orderId} is now ${newStatus} — Naya Lumière`,
      html: emailWrapper(content, 'Order Update'),
      attachments: [{ filename: `invoice-${orderId}.html`, content: invoiceHtml, contentType: 'text/html' }],
    });
    return { success: true };
  } catch (error) {
    console.error('Status update email error:', error);
    return { success: false };
  }
}

export async function sendMarketingEmail(recipients, subject, htmlContent) {
  try {
    const html = emailWrapper(`<div>${htmlContent}</div>`, subject);
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Marketing email error:', error);
    return { success: false };
  }
}

// ── Stock clearance campaign ───────────────────────────────────────────────
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

// Homepage palette — mirrors app/globals.css and the homepage components.
// Plain hex values: email clients support neither CSS variables nor rgb() in bgcolor attributes.
const HP = {
  ink:        '#111114', // --ink-900 — headings
  inkSoft:    '#5a5a64', // --ink-500 — body text
  gray:       '#9ca3af', // gray-400 — eyebrows, brand names
  border:     '#e8e8e8', // ProductCard border
  violet:     '#9368ec', // LAVENDER rgb(147,104,236) — homepage buttons and links
  violetWash: '#ede9fe', // LAVENDER_BG rgb(237,233,254)
  price:      '#7c3aed', // ProductCard sale price
  sale:       '#e63939', // ProductCard discount chip
  lowStock:   '#dc2626', // ProductCard "Only N left"
  promoStart: '#3b0764', // PromoBar gradient
  promoEnd:   '#4c0f8a',
  font:       HP_FONT,
};

const formatAed = (amount) => {
  const rounded = Math.round(amount * 100) / 100;
  return `AED ${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
};

// Square padded crops so product cards line up — email clients ignore object-fit
const squareProductImage = (url) => {
  if (!url) return `${BASE}/placeholder-image.jpg`;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/c_pad,w_440,h_440,b_white,f_jpg,q_auto/')
    : url;
};

// Solid violet pill — the homepage's primary button (welcome popup, sign in)
const solidButton = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:auto;margin:0 auto;border-collapse:separate;"><tr><td align="center" bgcolor="${HP.violet}" style="border-radius:999px;background-color:${HP.violet};padding:0;border-bottom:none;"><a href="${href}" style="display:inline-block;padding:15px 44px;font-family:${HP.font};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a></td></tr></table>`;

// Outlined white pill — the homepage hero CTA
const outlineButton = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:auto;margin:0;border-collapse:separate;"><tr><td style="border:1px solid #ffffff;border-radius:999px;padding:0;"><a href="${href}" style="display:inline-block;padding:13px 32px;font-family:${HP.font};font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>`;

// Mirrors the homepage ProductCard. The border sits on the grid cell itself,
// so both cards in a row always share the same height.
function clearanceProductCell(p, discountPercent) {
  const price    = Number(p.price);
  const rawName  = p.name.trim();
  const name     = escapeHtml(rawName.length > 48 ? rawName.slice(0, 46) + '…' : rawName);
  const url      = `${BASE}/product/${p.id}`;
  const lowStock = p.stock_quantity < 5
    ? `<p style="font-size:11px;font-weight:600;color:${HP.lowStock};margin:6px 0 0;line-height:1.4;">Only ${p.stock_quantity} left</p>`
    : '';

  return `<td width="50%" valign="top" style="width:50%;background-color:#ffffff;border:1px solid ${HP.border};padding:0;">
    <a class="pc-img" href="${url}" style="display:block;padding:14px 14px 0;text-decoration:none;"><img src="${squareProductImage(p.image_url)}" alt="${name}" width="220" style="display:block;width:100%;max-width:220px;height:auto;margin:0 auto;border:0;"></a>
    <div class="pc-body" style="padding:12px 12px 16px;font-family:${HP.font};">
      <p class="pc-brand" style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${HP.gray};margin:0 0 6px;line-height:1.4;">${escapeHtml(p.brand_name)}</p>
      <p style="margin:0 0 8px;line-height:1.45;"><a class="pc-name" href="${url}" style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${HP.ink};text-decoration:none;">${name}</a></p>
      <p style="margin:0;line-height:1.7;"><span style="display:inline-block;background-color:${HP.sale};color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;line-height:1.3;">-${discountPercent}%</span> <span style="font-size:12px;color:${HP.gray};text-decoration:line-through;white-space:nowrap;">${formatAed(price)}</span> <span style="font-size:13px;font-weight:600;color:${HP.price};white-space:nowrap;">${formatAed(price * (1 - discountPercent / 100))}</span></p>
      ${lowStock}
    </div>
  </td>`;
}

// Two products per row on every screen size, like the homepage mobile layout
function clearanceProductGrid(products, discountPercent) {
  const rows = [];
  for (let i = 0; i < products.length; i += 2) rows.push(products.slice(i, i + 2));

  return rows.map(pair => {
    const cells  = pair.map(p => clearanceProductCell(p, discountPercent)).join('');
    const filler = pair.length === 1 ? '<td width="50%" style="width:50%;padding:0;border-bottom:none;"></td>' : '';
    return `<tr>${cells}${filler}</tr>`;
  }).join('');
}

export function buildStockClearanceEmail({ firstName, code, discountPercent, expiresAt, heroImage, products = [] }) {
  const safeCode = escapeHtml(code);
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' })
    : null;
  const subject   = `${discountPercent}% off what's left in stock — Naya Lumière`;
  const preheader = `Your ${discountPercent}% code ${safeCode} is inside — the last of our stock, while it lasts.`;
  const greeting  = firstName ? `${escapeHtml(firstName)}, we're` : "We're";
  const shopUrl   = `${BASE}/all-products`;

  // Mirrors the homepage PromoBar
  const topBar = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;"><tr>
      <td align="center" bgcolor="${HP.promoStart}" style="background-color:${HP.promoStart};background-image:linear-gradient(90deg,${HP.promoStart} 0%,${HP.promoEnd} 100%);padding:10px 16px;border-bottom:none;font-family:${HP.font};font-size:12px;font-weight:600;color:#ffffff;line-height:1.6;">Use code <span style="display:inline-block;background-color:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:1px 10px;font-weight:700;letter-spacing:0.04em;">${safeCode}</span> for ${discountPercent}% off &middot; Free delivery on 3+ items</td>
    </tr></table>`;

  // Full-bleed photo with a dark scrim and white uppercase type, like the homepage hero.
  // Where background images are blocked (e.g. Outlook desktop) the dark bgcolor keeps the text readable.
  const heroBackground = heroImage
    ? `background="${escapeHtml(heroImage)}" style="background-color:#2a2a31;background-image:url('${escapeHtml(heroImage)}');background-size:cover;background-position:center;padding:0;border-bottom:none;"`
    : 'style="background-color:#2a2a31;padding:0;border-bottom:none;"';
  const hero = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;"><tr>
      <td bgcolor="#2a2a31" valign="bottom" ${heroBackground}>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;"><tr>
          <td class="hero-pad" valign="bottom" style="height:300px;background-color:rgba(17,17,20,0.30);background-image:linear-gradient(90deg,rgba(17,17,20,0.55) 0%,rgba(17,17,20,0.20) 70%,rgba(17,17,20,0) 100%);padding:64px 40px 40px;border-bottom:none;font-family:${HP.font};">
            <p style="font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.9);margin:0 0 10px;line-height:1.4;">Members' offer &middot; ${discountPercent}% off</p>
            <p class="hero-title" style="font-size:44px;font-weight:900;letter-spacing:0.02em;text-transform:uppercase;color:#ffffff;margin:0;line-height:1.05;">The last<br>pieces</p>
            <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.9);margin:14px 0 24px;line-height:1.6;max-width:380px;">${greeting} down to the final units of some of our favourite GERnétic, Zorah and Naya Lumière pieces. Enjoy ${discountPercent}% off before they're gone.</p>
            ${outlineButton(shopUrl, 'Shop the offer')}
          </td>
        </tr></table>
      </td>
    </tr></table>`;

  // Mirrors the homepage welcome popup
  const codeCard = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0 0;"><tr>
      <td align="center" style="border:1px solid ${HP.border};padding:32px 24px 30px;font-family:${HP.font};">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:${HP.ink};margin:0 0 12px;line-height:1.4;">Members' offer</p>
        <p style="font-size:26px;font-weight:700;color:${HP.ink};margin:0 0 20px;line-height:1.25;letter-spacing:-0.01em;">Get ${discountPercent}% off your order</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:auto;margin:0 auto;border-collapse:separate;"><tr><td align="center" style="border:2px dashed ${HP.violet};border-radius:999px;background-color:${HP.violetWash};padding:12px 32px;font-family:${HP.font};font-size:22px;font-weight:800;letter-spacing:0.14em;color:${HP.ink};line-height:1.2;">${safeCode}</td></tr></table>
        <p style="font-size:13px;color:${HP.inkSoft};margin:14px 0 24px;line-height:1.6;">Enter it at checkout${expiry ? ` &middot; Valid until ${expiry}` : ''}</p>
        ${solidButton(shopUrl, 'Shop now')}
      </td>
    </tr></table>`;

  // Mirrors the homepage header: logo on the left, main navigation on the right (hidden on phones)
  const navLinks = [['Shop', '/all-products'], ['Brands', '/brands'], ['Skin quiz', '/skin-quiz']]
    .map(([label, path]) => `<a href="${BASE}${path}" style="font-size:13px;font-weight:500;color:${HP.ink};text-decoration:none;margin-left:22px;">${label}</a>`)
    .join('');
  const header = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;"><tr>
      <td valign="middle" style="padding:0;border-bottom:none;">${brandHeader}</td>
      <td class="hide-mobile" align="right" valign="middle" style="padding:0;border-bottom:none;white-space:nowrap;font-family:${HP.font};">${navLinks}</td>
    </tr></table>`;

  // Mirrors the homepage section header ("Most loved / Best Sellers / View all →") and ProductCard grid.
  // The 8px cell spacing is the grid gutter, so the heading is inset by the same 8px to line up.
  const productSection = products.length === 0 ? '' : `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:40px 0 0;"><tr>
      <td valign="bottom" style="padding:0 8px;border-bottom:none;font-family:${HP.font};">
        <p style="font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:${HP.gray};margin:0 0 4px;line-height:1.4;">While stock lasts</p>
        <p style="font-size:28px;font-weight:700;color:${HP.ink};margin:0;line-height:1.2;">Still on our shelves</p>
      </td>
      <td class="hide-mobile" align="right" valign="bottom" style="padding:0 8px 4px;border-bottom:none;white-space:nowrap;font-family:${HP.font};"><a href="${shopUrl}" style="font-size:14px;font-weight:500;color:${HP.violet};text-decoration:none;">View all &rarr;</a></td>
    </tr></table>
    <p style="font-family:${HP.font};font-size:13px;color:${HP.inkSoft};margin:8px 8px 4px;line-height:1.5;">Prices below already include your ${discountPercent}%.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="8" border="0" style="width:100%;margin:0;border-collapse:separate;border-spacing:8px;">${clearanceProductGrid(products, discountPercent)}</table>
    <div style="text-align:center;margin:16px 0 0;">${solidButton(shopUrl, 'Shop all products')}</div>`;

  const trust = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:36px 0 0;border-collapse:collapse;"><tr>
      ${['Free delivery on 3+ items', 'Secure checkout', 'Official brand retailer'].map(text =>
        `<td width="33%" align="center" valign="top" style="width:33%;padding:16px 4px;border-top:1px solid ${HP.border};border-bottom:1px solid ${HP.border};font-family:${HP.font};font-size:12px;font-weight:500;color:${HP.inkSoft};line-height:1.5;"><span style="color:${HP.violet};font-weight:700;">&#10003;</span><br>${text}</td>`
      ).join('')}
    </tr></table>`;

  const signOff = `
    <p style="font-family:${HP.font};font-size:14px;color:${HP.inkSoft};margin:32px 0 0;text-align:center;line-height:1.6;">With love,<br><strong style="font-weight:600;color:${HP.ink};">The Naya Lumière Cosmetics team</strong></p>
    <p style="font-family:${HP.font};font-size:11px;color:${HP.gray};margin:20px 0 0;text-align:center;line-height:1.6;">${discountPercent}% off your order subtotal with code ${safeCode}${expiry ? `, valid until ${expiry}` : ''}, while stock lasts. You're receiving this because you have a Naya Lumière Cosmetics account.</p>`;

  const content = `
    ${codeCard}
    ${productSection}
    ${trust}
    ${signOff}
  `;

  return { subject, html: emailWrapper(content, subject, preheader, { topBar, header, hero }) };
}

// Sent one recipient at a time so customers never see each other's addresses
export async function sendStockClearanceEmail(email, options) {
  try {
    const { subject, html } = buildStockClearanceEmail(options);
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: options.subjectPrefix ? `${options.subjectPrefix} ${subject}` : subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error(`Stock clearance email error (${email}):`, error);
    return { success: false, error: error.message };
  }
}

export async function sendAbandonedCartEmail(email, firstName, cartItems) {
  try {
    const itemsHtml = cartItems.map(item => `
      <tr>
        <td>
          <div style="font-weight:700; color:${C.text};">${item.name}</div>
          <div style="font-size:11px; color:${C.muted}; margin-top:2px;">${item.brand || 'Naya Lumière'}</div>
        </td>
        <td style="text-align:right; font-weight:700; color:${C.text};">AED ${Number(item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Your cart is waiting, ${firstName}</h2>
      <p>You left some of our botanical treasures behind. Bring your ritual home before they sell out.</p>

      <h3>Left in Your Cart</h3>
      <table>
        <thead><tr><th>Product</th><th style="text-align:right;">Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <a href="${BASE}/cart" class="btn">Return to Cart</a>
      ${productSuggestionBlock(products, 'You Might Also Love')}
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${firstName}, your cart is still waiting — Naya Lumière`,
      html: emailWrapper(content, 'Your Cart'),
    });
    return { success: true };
  } catch (error) {
    console.error('Abandoned cart email error:', error);
    return { success: false };
  }
}

export async function sendPayoutRequestNotificationEmail(recipients, amount, currency, payoutId) {
  try {
    const content = `
      <h2>Payout Requested</h2>
      <p>A manual payout has been initiated from the Naya Lumière Stripe account.</p>
      <div class="box">
        <div class="row"><span>Payout ID</span><span style="font-weight:700; color:${C.text};">${payoutId}</span></div>
        <div class="row"><span>Amount</span><span style="font-weight:800; color:${C.text};">${amount.toFixed(2)} ${currency.toUpperCase()}</span></div>
        <div class="row"><span>Status</span><span style="color:${C.purple}; font-weight:700;">Pending</span></div>
      </div>
      <a href="${BASE}/admin/payments" class="btn">Review Payments</a>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: `Payout Requested: ${amount.toFixed(2)} ${currency.toUpperCase()}`,
      html: emailWrapper(content, 'Payout Notification'),
    });
    return { success: true };
  } catch (error) {
    console.error('Payout notification email error:', error);
    return { success: false };
  }
}

export async function sendTransactionNotificationEmail(recipients, txDetails) {
  try {
    const { id, amount, fee, net, currency, status, type, created, source, receipt_email } = txDetails;
    const pm      = source?.payment_method;
    const pmDets  = source?.payment_method_details;
    const card    = pm?.card || pmDets?.card;
    const billing = pm?.billing_details || source?.billing_details;
    const ownerEmail = billing?.email || source?.customer?.email || receipt_email;
    const ownerName  = billing?.name  || source?.customer?.name  || 'N/A';

    const content = `
      <h2>Transaction ${id}</h2>
      <p>Stripe transaction details for your records.</p>

      <div class="box">
        <div class="row"><span>Status</span><span style="font-weight:700; color:${C.text}; text-transform:uppercase;">${status}</span></div>
        <div class="row"><span>Type</span><span style="text-transform:capitalize;">${type.replace(/_/g, ' ')}</span></div>
        <div class="row"><span>Date</span><span>${new Date(created * 1000).toLocaleString()}</span></div>
      </div>

      <h3>Financial Breakdown</h3>
      <table>
        <tbody>
          <tr><td style="font-weight:700;">Gross</td><td style="text-align:right;">${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</td></tr>
          <tr><td style="font-weight:700; color:#ef4444;">Stripe Fee</td><td style="text-align:right; color:#ef4444;">−${(fee / 100).toFixed(2)} ${currency.toUpperCase()}</td></tr>
          <tr><td style="font-weight:800; border-bottom:none;">Net</td><td style="text-align:right; font-weight:800; color:#16a34a; border-bottom:none;">${(net / 100).toFixed(2)} ${currency.toUpperCase()}</td></tr>
        </tbody>
      </table>

      ${card ? `
      <h3>Payment Method</h3>
      <div class="box" style="font-size:14px; color:${C.sub};">
        <div style="margin-bottom:10px;"><strong style="color:${C.text}; font-size:16px;">•••• •••• •••• ${card.last4 || 'N/A'}</strong></div>
        <div class="row"><span>Brand</span><span style="text-transform:capitalize;">${card.brand || 'N/A'}</span></div>
        <div class="row"><span>Expires</span><span>${card.exp_month || 'MM'}/${card.exp_year || 'YY'}</span></div>
        <div class="row"><span>Country</span><span>${card.country || 'N/A'}</span></div>
      </div>` : ''}

      <h3>Cardholder</h3>
      <div class="box" style="font-size:14px; color:${C.sub}; line-height:1.8;">
        <strong style="color:${C.text};">${ownerName}</strong><br>
        ${ownerEmail || 'Email not provided'}
        ${billing?.address?.line1 ? `<br>${billing.address.line1}, ${billing.address.city || ''} ${billing.address.country || ''}` : ''}
      </div>

      <a href="${BASE}/admin/payments" class="btn">Go to Dashboard</a>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: `Transaction: ${id}`,
      html: emailWrapper(content, 'Transaction Details'),
    });
    return { success: true };
  } catch (error) {
    console.error('Transaction notification email error:', error);
    return { success: false };
  }
}

export async function sendPasswordResetEmail(email, firstName, resetUrl) {
  try {
    // No product strip here — this email is time-critical and the strip costs
    // an ORDER BY RANDOM() scan over products before we can even send.
    const content = `
      <h2>Reset Your Password</h2>
      <p>Hi ${firstName}, we received a request to reset the password for your Naya Lumière account. Click below — this link expires in 1 hour.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${resetUrl || '#'}" class="btn">Reset Password</a>
      </div>
      <p style="font-size:13px; color:${C.muted};">If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size:11px; color:${C.divider}; word-break:break-all;">${resetUrl || ''}</p>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your password — Naya Lumière',
      html: emailWrapper(content, 'Password Reset'),
    });
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false };
  }
}

export async function sendEmailVerificationEmail(email, firstName, verifyUrl) {
  try {
    // Deliberately no product strip — see sendPasswordResetEmail.
    const content = `
      <h2>Confirm Your Email</h2>
      <p>Hi ${firstName}, one last step — verify your email address to activate your Naya Lumière account. This link expires in 24 hours.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size:13px; color:${C.muted};">If you didn't create an account, you can safely ignore this email.</p>
      <p style="font-size:11px; color:${C.divider}; word-break:break-all;">${verifyUrl}</p>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email — Naya Lumière',
      html: emailWrapper(content, 'Email Verification'),
    });
    return { success: true };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false };
  }
}

// ── Invoice attachment (separate from email wrapper — keeps its own style) ─
export function generateInvoiceHtml(orderDetails) {
    // A UAE tax invoice must state the VAT even though the price includes it.
    // Prefer the figure recorded on the order; derive it only for legacy rows.
    const invoiceVat = Number(orderDetails.taxAmount) > 0
        ? Number(orderDetails.taxAmount)
        : vatFromGross(orderDetails.totalAmount);
    const invoiceNet = Math.round((Number(orderDetails.totalAmount) - invoiceVat) * 100) / 100;

    const orderDate = new Date(orderDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(orderDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const productsHtml = orderDetails.items.map(item => `
        <tr>
            <td style="padding:14px 8px; border-bottom:1px solid #f0f0f0; color:#5a5a64; font-size:14px;">${item.name}</td>
            <td style="padding:14px 8px; border-bottom:1px solid #f0f0f0; color:#5a5a64; font-size:14px; text-align:center;">${item.quantity}</td>
            <td style="padding:14px 8px; border-bottom:1px solid #f0f0f0; color:#5a5a64; font-size:14px;">AED ${Number(item.price).toFixed(2)}</td>
            <td style="padding:14px 8px; border-bottom:1px solid #f0f0f0; color:#111114; font-size:14px; font-weight:700; text-align:right;">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;margin:0;padding:0;color:#111114;}</style>
</head>
<body>
    <div style="max-width:800px; margin:40px auto; background:#ffffff;">

        <div style="height:3px; background:linear-gradient(90deg,rgb(196,167,254),rgb(126,105,230));"></div>

        <div style="padding:36px 40px 28px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f0f0f0;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle; padding-right:11px;"><img src="${LOGO_URL}" alt="Naya Lumière" width="28" height="28" style="display:block;"></td>
                <td style="vertical-align:middle;">
                  <div style="font-size:16px; font-weight:700; letter-spacing:0.06em; color:#111114; text-transform:uppercase; line-height:1; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">NAYA LUMIÈRE</div>
                  <div style="font-size:9px; letter-spacing:0.32em; color:#5a5a64; text-transform:uppercase; margin-top:3px; line-height:1; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">COSMETICS</div>
                </td>
              </tr>
            </table>
            <div style="text-align:right; font-size:13px; color:#5a5a64;">
                <div style="font-size:18px; font-weight:900; color:#111114; margin-bottom:6px;">INVOICE</div>
                <div>No. <strong style="color:#111114;">INV-${orderDetails.id}</strong></div>
                <div style="margin-top:4px;">${orderDate} · ${orderTime}</div>
            </div>
        </div>

        <div style="padding:28px 40px; display:flex; justify-content:space-between; border-bottom:1px solid #f0f0f0;">
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:#8a8a93; margin-bottom:10px;">From</div>
                <div style="font-size:14px; color:#5a5a64; line-height:1.8;">Naya Lumière Cosmetics<br>Dubai, United Arab Emirates</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:#8a8a93; margin-bottom:10px;">Bill To</div>
                <div style="font-size:14px; color:#5a5a64; line-height:1.8;">${orderDetails.customerName}<br>${orderDetails.customerEmail}</div>
            </div>
        </div>

        <div style="padding:20px 40px; display:flex; gap:40px; border-bottom:1px solid #f0f0f0;">
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:#8a8a93; margin-bottom:6px;">Payment</div>
                <div style="font-size:14px; color:#5a5a64;">${orderDetails.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:#8a8a93; margin-bottom:6px;">Status</div>
                <div style="font-size:14px; font-weight:700; color:#111114;">Paid</div>
            </div>
        </div>

        <div style="padding:28px 40px;">
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f5f7;">
                        <th style="padding:12px 8px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#8a8a93; border-bottom:1px solid #f0f0f0;">Item</th>
                        <th style="padding:12px 8px; text-align:center; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#8a8a93; border-bottom:1px solid #f0f0f0;">Qty</th>
                        <th style="padding:12px 8px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#8a8a93; border-bottom:1px solid #f0f0f0;">Unit Price</th>
                        <th style="padding:12px 8px; text-align:right; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#8a8a93; border-bottom:1px solid #f0f0f0;">Total</th>
                    </tr>
                </thead>
                <tbody>${productsHtml}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding:20px 8px 8px; text-align:right; font-size:14px; color:#5a5a64;">Total</td>
                        <td style="padding:20px 8px 8px; text-align:right; font-size:20px; font-weight:900; color:#111114; border-top:2px solid #f0f0f0;">AED ${Number(orderDetails.totalAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding:2px 8px; text-align:right; font-size:12px; color:#8a8a93;">Net of VAT</td>
                        <td style="padding:2px 8px; text-align:right; font-size:12px; color:#8a8a93;">AED ${invoiceNet.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding:2px 8px 8px; text-align:right; font-size:12px; color:#8a8a93;">Includes VAT (5%)</td>
                        <td style="padding:2px 8px 8px; text-align:right; font-size:12px; color:#8a8a93;">AED ${invoiceVat.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div style="padding:24px 40px; background:#f5f5f7; text-align:center;">
            <p style="font-size:11px; color:#8a8a93; margin:0 0 4px;">Thank you for choosing Naya Lumière Cosmetics.</p>
            <p style="font-size:10px; color:#c8c8cf; margin:0; letter-spacing:0.15em; text-transform:uppercase;">Geneva &nbsp;·&nbsp; Dubai &nbsp;·&nbsp; Paris</p>
        </div>
    </div>
</body>
</html>`;
}
