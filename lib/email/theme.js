// ═══════════════════════════════════════════════════════════════════════════
// Unified email template — every email Naya Lumière sends is built from here.
//
// Rules this file follows so the result survives real inboxes:
//   - Tables for layout, never flex/grid (Outlook's Word engine ignores both).
//   - Inline styles on every element; the <style> block only adds progressive
//     extras (mobile padding, hiding nav) that clients are free to drop.
//   - Plain hex colours: no CSS variables, and no rgb() in bgcolor attributes.
//   - Buttons are "bulletproof": a coloured cell around the link, so they still
//     read as buttons in clients that strip background images or gradients.
//   - Every interpolated value goes through escapeHtml unless it is markup we
//     built ourselves.
//
// The palette mirrors the storefront: white surfaces, gray-100 hairlines, ink
// text, the violet pill buttons and the PromoBar's deep-purple strip.
// ═══════════════════════════════════════════════════════════════════════════

export const BASE     = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';
export const LOGO_URL = 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
export const FROM     = () => `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`;

export const T = {
  page:       '#f5f5f7', // section background behind the card
  card:       '#ffffff',
  ink:        '#111114', // headings
  inkSoft:    '#5a5a64', // body text
  muted:      '#8a8a93', // meta, captions
  faint:      '#b4b4bc', // legal small print
  border:     '#ececef', // hairlines (gray-100 on white)
  wash:       '#fafafb', // inset panels
  violet:     '#9368ec', // LAVENDER rgb(147,104,236) — buttons and links
  violetDark: '#7e69e6', // hover shade, used for link text on wash
  violetWash: '#f3effd', // soft violet panels
  price:      '#7c3aed', // ProductCard sale price
  sale:       '#e63939', // ProductCard discount chip
  promoStart: '#3b0764', // PromoBar gradient
  promoEnd:   '#4c0f8a',
};

export const FONT = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";

// Callout tones. `ink` doubles as the left rule and the text colour.
export const TONES = {
  info:    { bg: T.violetWash, ink: '#5b3fc4', line: '#ddd3fb' },
  success: { bg: '#ecfdf5',    ink: '#065f46', line: '#a7f3d0' },
  warning: { bg: '#fffbeb',    ink: '#92400e', line: '#fde68a' },
  danger:  { bg: '#fef2f2',    ink: '#991b1b', line: '#fecaca' },
  neutral: { bg: T.wash,       ink: T.inkSoft, line: T.border },
};

// ── Formatting helpers ────────────────────────────────────────────────────

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

// For href attributes: only http(s), mailto and tel survive; anything else
// (javascript:, data:) collapses to the storefront.
export const safeUrl = (url) => {
  const value = String(url ?? '').trim();
  return /^(https?:|mailto:|tel:)/i.test(value) ? escapeHtml(value) : escapeHtml(BASE);
};

export const money = (value) => `AED ${Number(value || 0).toFixed(2)}`;

export const formatAed = (amount) => {
  const rounded = Math.round(Number(amount || 0) * 100) / 100;
  return `AED ${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
};

export const dubaiTime = (value) => new Date(value || Date.now()).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai',
});

export const dubaiDate = (value) => new Date(value || Date.now()).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai',
});

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

// Square padded crops so product images line up — email clients ignore object-fit
export const squareImage = (url, size = 440) => {
  if (!url) return `${BASE}/placeholder-image.jpg`;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/c_pad,w_${size},h_${size},b_white,f_jpg,q_auto/`)
    : url;
};

// Shorthand for the reset every layout table needs
const TABLE = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';
const tableStyle = (extra = '') => `width:100%;border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;${extra}`;

// ── Atoms ─────────────────────────────────────────────────────────────────

/** Solid violet pill — the storefront's primary button. */
export const button = (href, label, { align = 'left', variant = 'solid', full = false } = {}) => {
  const solid = variant === 'solid';
  const cell = solid
    ? `bgcolor="${T.violet}" style="border-radius:999px;background-color:${T.violet};"`
    : `style="border-radius:999px;border:1px solid ${T.ink};"`;
  const link = `display:block;padding:${solid ? '15px 36px' : '14px 35px'};font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${solid ? '#ffffff' : T.ink};text-decoration:none;border-radius:999px;text-align:center;white-space:nowrap;`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"${align === 'center' ? ' align="center"' : ''} style="${full ? 'width:100%;' : ''}border-collapse:separate;margin:${align === 'center' ? '0 auto' : '0'};"><tr>
      <td align="center" ${cell}><a href="${safeUrl(href)}" style="${link}">${escapeHtml(label)}</a></td>
    </tr></table>`;
};

/** Two buttons side by side; the secondary is the outlined pill. */
export const buttonRow = (primary, secondary) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0;"><tr>
      <td class="stack" style="padding:0 10px 10px 0;">${button(primary.href, primary.label)}</td>
      ${secondary ? `<td class="stack" style="padding:0 0 10px;">${button(secondary.href, secondary.label, { variant: 'outline' })}</td>` : ''}
    </tr></table>`;

export const textLink = (href, label) =>
  `<a href="${safeUrl(href)}" style="color:${T.violet};text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`;

export const spacer = (height = 24) =>
  `<table ${TABLE} style="${tableStyle()}"><tr><td height="${height}" style="height:${height}px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

export const divider = (margin = 28) =>
  `<table ${TABLE} style="${tableStyle(`margin:${margin}px 0;`)}"><tr><td style="border-top:1px solid ${T.border};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>`;

export const paragraph = (html, { size = 15, color = T.inkSoft, align = 'left', margin = '0 0 14px' } = {}) =>
  `<p style="font-family:${FONT};font-size:${size}px;line-height:1.7;color:${color};margin:${margin};text-align:${align};">${html}</p>`;

// ── Blocks ────────────────────────────────────────────────────────────────

/**
 * The opening of every email: small violet eyebrow, a big headline, a lead
 * line. `badge` is an optional glyph shown in a soft circle above it all.
 */
export const intro = ({ eyebrow, heading, lead, badge, badgeTone = 'info', align = 'left' }) => {
  const tone = TONES[badgeTone] || TONES.info;
  return `
    ${badge ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"${align === 'center' ? ' align="center"' : ''} style="border-collapse:separate;margin:${align === 'center' ? '0 auto 20px' : '0 0 20px'};"><tr>
      <td width="52" height="52" align="center" valign="middle" bgcolor="${tone.bg}" style="width:52px;height:52px;border-radius:999px;background-color:${tone.bg};border:1px solid ${tone.line};font-family:${FONT};font-size:22px;font-weight:800;color:${tone.ink};line-height:52px;text-align:center;">${badge}</td>
    </tr></table>
` : ''}
    ${eyebrow ? `<p style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${T.violet};margin:0 0 10px;line-height:1.4;text-align:${align};">${eyebrow}</p>` : ''}
    <h1 class="h1" style="font-family:${FONT};font-size:28px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;color:${T.ink};margin:0 0 14px;text-align:${align};">${heading}</h1>
    ${lead ? paragraph(lead, { size: 16, align, margin: '0' }) : ''}`;
};

/** A titled section: small uppercase label with a hairline, then the content. */
export const section = (title, inner, { margin = 36 } = {}) => !inner ? '' : `
    <table ${TABLE} style="${tableStyle(`margin:${margin}px 0 0;`)}"><tr>
      <td style="padding:0 0 12px;border-bottom:1px solid ${T.border};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};line-height:1.4;">${title}</td>
    </tr></table>
    ${inner}`;

/** Coloured callout with a strong left rule. `body` is trusted markup. */
export const notice = ({ tone = 'info', title, body, extra = '' }) => {
  const t = TONES[tone] || TONES.info;
  return `
    <table ${TABLE} style="${tableStyle('margin:28px 0 0;')}"><tr>
      <td bgcolor="${t.bg}" style="background-color:${t.bg};border:1px solid ${t.line};border-left:4px solid ${t.ink};border-radius:6px;padding:16px 20px;font-family:${FONT};">
        ${title ? `<div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${t.ink};line-height:1.5;">${title}</div>` : ''}
        ${body ? `<div style="font-size:14px;color:${t.ink};margin:${title ? '4px' : '0'} 0 0;line-height:1.6;">${body}</div>` : ''}
        ${extra}
      </td>
    </tr></table>`;
};

/** Inset grey panel for addresses, quotes and the like. */
export const panel = (inner, { margin = '16px 0 0', accent = false } = {}) => `
    <table ${TABLE} style="${tableStyle(`margin:${margin};`)}"><tr>
      <td bgcolor="${T.wash}" style="background-color:${T.wash};border:1px solid ${T.border};${accent ? `border-left:3px solid ${T.violet};` : ''}border-radius:6px;padding:18px 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${T.inkSoft};">${inner}</td>
    </tr></table>`;

/** Label/value rows; rows with no value are dropped. Values are trusted markup. */
export const infoRow = (label, value) => value ? `
      <tr>
        <td width="130" style="width:130px;padding:11px 12px 11px 0;border-bottom:1px solid ${T.border};font-family:${FONT};font-size:13px;color:${T.muted};vertical-align:top;line-height:1.6;">${label}</td>
        <td style="padding:11px 0;border-bottom:1px solid ${T.border};font-family:${FONT};font-size:14px;color:${T.ink};vertical-align:top;line-height:1.6;">${value}</td>
      </tr>` : '';

export const infoTable = (rows) => `
    <table ${TABLE} style="${tableStyle()}">${rows.filter(Boolean).join('')}</table>`;

/**
 * Order lines. `thumbs` adds a product image (customer copies); `meta` adds the
 * product id the fulfilment team picks by. An item's optional `note` (plain text)
 * shows under it, e.g. "2 on pre-order".
 */
export const lineItems = (items, { thumbs = true, meta = false } = {}) => {
  if (!items || items.length === 0) return '';
  return `
    <table ${TABLE} style="${tableStyle()}">${items.map(item => {
      const quantity  = Number(item.quantity || 0);
      const unitPrice = Number(item.price || 0);
      const image     = item.imageUrl || item.image_url;
      return `
      <tr>
        ${thumbs ? `<td width="72" valign="top" style="width:72px;padding:14px 14px 14px 0;border-bottom:1px solid ${T.border};">
          <img src="${escapeHtml(squareImage(image, 144))}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;border:1px solid ${T.border};border-radius:6px;background:#ffffff;">
        </td>` : ''}
        <td valign="top" style="padding:14px 12px 14px 0;border-bottom:1px solid ${T.border};font-family:${FONT};line-height:1.5;">
          ${item.brand || item.brandName ? `<div style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${T.muted};margin:0 0 3px;">${escapeHtml(item.brand || item.brandName)}</div>` : ''}
          <div style="font-size:14px;font-weight:600;color:${T.ink};">${escapeHtml(item.name || 'Unknown product')}</div>
          <div style="font-size:12px;color:${T.muted};margin-top:3px;">${meta ? `ID ${escapeHtml(item.productId ?? '—')} &middot; ` : ''}Qty ${quantity} &middot; ${money(unitPrice)} each</div>
          ${item.note ? `<div style="font-size:12px;font-weight:600;color:${T.violet};margin-top:3px;">${escapeHtml(item.note)}</div>` : ''}
        </td>
        <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ${T.border};font-family:${FONT};font-size:14px;font-weight:700;color:${T.ink};text-align:right;white-space:nowrap;line-height:1.5;">${money(unitPrice * quantity)}</td>
      </tr>`;
    }).join('')}
    </table>`;
};

const totalRow = (label, value, { strong = false, accent = null } = {}) => `
      <tr>
        <td style="padding:${strong ? '14px 0 0' : '5px 0'};${strong ? `border-top:1px solid ${T.border};` : ''}font-family:${FONT};font-size:${strong ? '16px' : '14px'};font-weight:${strong ? '800' : '400'};color:${accent || (strong ? T.ink : T.inkSoft)};line-height:1.6;">${label}</td>
        <td align="right" style="padding:${strong ? '14px 0 0' : '5px 0'};${strong ? `border-top:1px solid ${T.border};` : ''}font-family:${FONT};font-size:${strong ? '18px' : '14px'};font-weight:${strong ? '800' : '600'};color:${accent || T.ink};text-align:right;white-space:nowrap;line-height:1.6;">${value}</td>
      </tr>`;

export const formatShippingCost = (cost) =>
  !cost || isNaN(cost) || Number(cost) === 0 ? 'Free' : money(cost);

/** Totals. The breakdown renders only when a subtotal was supplied. */
export const totals = ({ subtotal, shippingCost, giftWrapCost, taxAmount, discountAmount, couponCode, total }) => `
    <table ${TABLE} style="${tableStyle('margin:14px 0 0;')}">
      ${subtotal != null ? totalRow('Subtotal', money(subtotal)) : ''}
      ${subtotal != null ? totalRow('Delivery', formatShippingCost(shippingCost)) : ''}
      ${Number(giftWrapCost) > 0 ? totalRow('Gift wrap', money(giftWrapCost)) : ''}
      ${Number(discountAmount) > 0 ? totalRow(`Discount${couponCode ? ` (${escapeHtml(couponCode)})` : ''}`, `&minus;${money(discountAmount)}`, { accent: T.price }) : ''}
      ${totalRow('Total', money(total), { strong: true })}
      ${Number(taxAmount) > 0 ? `
      <tr><td colspan="2" align="right" style="padding:4px 0 0;font-family:${FONT};font-size:12px;color:${T.muted};text-align:right;line-height:1.6;">Includes VAT of ${money(taxAmount)}</td></tr>` : ''}
    </table>`;

export const addressLines = (address = {}) => [
  address.street,
  [address.city, address.zip].filter(Boolean).join(', '),
  address.state,
  address.country,
].filter(Boolean).map(escapeHtml).join('<br>');

/**
 * Progress tracker: one bar segment per step, filled up to the current step,
 * with a label underneath. Flat cells only, so it can't collapse in any client.
 * `current` is the index of the active step; `failed` turns that step red.
 */
export const tracker = (steps, current, { failed = false } = {}) => {
  const width = `${Math.floor(100 / steps.length)}%`;
  const state = (i) => failed && i === current ? 'failed' : i < current ? 'done' : i === current ? 'active' : 'todo';
  const bar = { done: T.violet, active: T.violet, failed: TONES.danger.ink, todo: T.border };
  const ink = { done: T.inkSoft, active: T.ink, failed: TONES.danger.ink, todo: T.faint };
  // The current step is reached too, so it gets a tick; without one a Shipped email read as "Placed"
  const mark = { done: '&#10003; ', active: '&#10003; ', failed: '&#10005; ', todo: '' };
  return `
    <table ${TABLE} style="${tableStyle('margin:28px 0 0;table-layout:fixed;')}">
      <tr>${steps.map((_, i) => `
        <td width="${width}" style="width:${width};padding:0 ${i === steps.length - 1 ? 0 : 4}px 0 0;"><div style="height:4px;line-height:4px;font-size:0;border-radius:4px;background-color:${bar[state(i)]};">&nbsp;</div></td>`).join('')}
      </tr>
      <tr>${steps.map((label, i) => `
        <td valign="top" style="padding:9px 4px 0 0;font-family:${FONT};font-size:12px;font-weight:${state(i) === 'todo' ? 500 : state(i) === 'done' ? 600 : 800};color:${ink[state(i)]};line-height:1.4;">${mark[state(i)]}${label}</td>`).join('')}
      </tr>
    </table>`;
};

/** Dashed coupon/code ticket like the storefront welcome popup. */
export const codeTicket = (code, caption = '') => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;margin:0 auto;"><tr>
      <td align="center" bgcolor="${T.violetWash}" style="border:2px dashed ${T.violet};border-radius:999px;background-color:${T.violetWash};padding:12px 32px;font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:0.14em;color:${T.ink};line-height:1.2;">${escapeHtml(code)}</td>
    </tr></table>
    ${caption ? paragraph(caption, { size: 13, align: 'center', margin: '12px 0 0' }) : ''}`;

/** The raw URL under a button, for clients that break the button. */
export const fallbackLink = (url) => `
    ${paragraph('Button not working? Paste this link into your browser:', { size: 12, color: T.muted, margin: '24px 0 4px' })}
    <p style="font-family:${FONT};font-size:12px;line-height:1.5;margin:0;word-break:break-all;"><a href="${safeUrl(url)}" style="color:${T.violet};text-decoration:none;">${escapeHtml(url)}</a></p>`;

/** Mirrors the storefront ProductCard; optional `discountPercent` shows the sale chip. */
const productCell = (p, { discountPercent = 0, width = '50%' } = {}) => {
  const price    = Number(p.price);
  const rawName  = String(p.name || '').trim();
  const name     = escapeHtml(rawName.length > 48 ? rawName.slice(0, 46) + '…' : rawName);
  const url      = `${BASE}/product/${encodeURIComponent(p.id)}`;
  const lowStock = discountPercent && p.stock_quantity < 5
    ? `<p style="font-size:11px;font-weight:600;color:${T.sale};margin:6px 0 0;line-height:1.4;">Only ${Number(p.stock_quantity)} left</p>`
    : '';
  const priceLine = discountPercent
    ? `<span style="display:inline-block;background-color:${T.sale};color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;line-height:1.3;">-${discountPercent}%</span> <span style="font-size:12px;color:${T.faint};text-decoration:line-through;white-space:nowrap;">${formatAed(price)}</span> <span style="font-size:13px;font-weight:700;color:${T.price};white-space:nowrap;">${formatAed(price * (1 - discountPercent / 100))}</span>`
    : `<span style="font-size:13px;font-weight:700;color:${T.ink};white-space:nowrap;">${formatAed(price)}</span>`;

  return `<td width="${width}" valign="top" style="width:${width};background-color:#ffffff;border:1px solid ${T.border};border-radius:6px;padding:0;">
    <a class="pc-img" href="${url}" style="display:block;padding:14px 14px 0;text-decoration:none;"><img src="${escapeHtml(squareImage(p.image_url))}" alt="${name}" width="220" style="display:block;width:100%;max-width:220px;height:auto;margin:0 auto;border:0;"></a>
    <div class="pc-body" style="padding:12px 12px 16px;font-family:${FONT};">
      <p class="pc-brand" style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${T.muted};margin:0 0 6px;line-height:1.4;">${escapeHtml(p.brand_name || 'Naya Lumière')}</p>
      <p style="margin:0 0 8px;line-height:1.45;"><a class="pc-name" href="${url}" style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${T.ink};text-decoration:none;">${name}</a></p>
      <p style="margin:0;line-height:1.7;">${priceLine}</p>
      ${lowStock}
    </div>
  </td>`;
};

/** Product grid; `columns` 2 or 3. Short final rows are padded with empty cells. */
export const productGrid = (products, { columns = 2, discountPercent = 0 } = {}) => {
  if (!products || products.length === 0) return '';
  const width = `${Math.floor(100 / columns)}%`;
  const rows = [];
  for (let i = 0; i < products.length; i += columns) rows.push(products.slice(i, i + columns));
  return `
    <table ${TABLE} cellspacing="8" style="width:100%;border-collapse:separate;border-spacing:8px;margin:0;">${rows.map(row => `
      <tr>${row.map(p => productCell(p, { discountPercent, width })).join('')}${
        Array.from({ length: columns - row.length }, () => `<td width="${width}" style="width:${width};"></td>`).join('')
      }</tr>`).join('')}
    </table>`;
};

/** "For you" strip at the foot of customer emails. */
export const recommendations = (products, title = 'You may also love') => {
  if (!products || products.length === 0) return '';
  return `
    <table ${TABLE} style="${tableStyle('margin:44px 0 0;')}"><tr>
      <td valign="bottom" style="padding:0 8px;font-family:${FONT};">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.muted};margin:0 0 4px;line-height:1.4;">Picked for you</p>
        <p style="font-size:22px;font-weight:700;color:${T.ink};margin:0 0 4px;line-height:1.2;">${escapeHtml(title)}</p>
      </td>
      <td align="right" valign="bottom" class="hide-mobile" style="padding:0 8px 6px;font-family:${FONT};white-space:nowrap;">${textLink(`${BASE}/all-products`, 'View all →')}</td>
    </tr></table>
    ${productGrid(products, { columns: products.length >= 3 ? 3 : products.length })}`;
};

export const signOff = (who = 'The Naya Lumière Cosmetics team') =>
  paragraph(`With love,<br><strong style="font-weight:600;color:${T.ink};">${escapeHtml(who)}</strong>`, { margin: '36px 0 0' });

// ── Chrome: strip, header, footer ─────────────────────────────────────────

/** Deep-purple strip above the header, mirroring the storefront PromoBar. Trusted markup. */
export const topStrip = (html) => `
    <table ${TABLE} style="${tableStyle()}"><tr>
      <td align="center" bgcolor="${T.promoStart}" style="background-color:${T.promoStart};background-image:linear-gradient(90deg,${T.promoStart} 0%,${T.promoEnd} 100%);padding:10px 20px;font-family:${FONT};font-size:12px;font-weight:600;color:#ffffff;line-height:1.6;">${html}</td>
    </tr></table>`;

/**
 * The site's logo lockup (BrandLogo): lotus + "NAYA LUMIÈRE" in widely spaced
 * sans capitals + a small "COSMETICS" spread underneath. Text, not an image, so
 * it reads even when a mail app blocks pictures; tables only, email-safe.
 */
export const brandLockup = () => `<a href="${BASE}" style="text-decoration:none;color:${T.ink};"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:auto;"><tr>
      <td valign="middle" style="padding:0 11px 0 0;"><img src="${LOGO_URL}" alt="" width="30" height="26" style="display:block;width:30px;height:26px;border:0;outline:none;"></td>
      <td valign="middle" style="font-family:${FONT};line-height:1;">
        <div style="font-size:17px;font-weight:400;letter-spacing:0.22em;color:${T.ink};white-space:nowrap;line-height:1;">NAYA LUMI&Egrave;RE</div>
        <div style="font-size:7.5px;font-weight:400;letter-spacing:1.9em;color:#6b6b75;white-space:nowrap;line-height:1;margin-top:5px;">COSMETICS</div>
      </td>
    </tr></table></a>`;
const brandMark = brandLockup();

const NAV = [['Shop', '/all-products'], ['Skincare', '/SkinCare'], ['Fragrance', '/fragrance'], ['Account', '/account']];

const header = (audience) => {
  const right = audience === 'admin'
    ? `<span style="display:inline-block;background-color:${T.violetWash};color:${T.violetDark};border-radius:999px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;">Admin</span>`
    : NAV.map(([label, path]) => `<a href="${BASE}${path}" style="font-size:13px;font-weight:500;color:${T.ink};text-decoration:none;margin-left:20px;">${label}</a>`).join('');
  return `
    <table ${TABLE} style="${tableStyle()}"><tr>
      <td class="px" valign="middle" style="padding:22px 40px 18px;border-bottom:1px solid ${T.border};">${brandMark}</td>
      <td class="px hide-mobile" align="right" valign="middle" style="padding:22px 40px 18px;border-bottom:1px solid ${T.border};white-space:nowrap;font-family:${FONT};">${right}</td>
    </tr></table>`;
};

const TRUST = ['Free delivery on 3+ items', 'Secure checkout', 'Official brand retailer'];

const footer = (audience, note) => {
  if (audience === 'admin') {
    return `
    <table ${TABLE} style="${tableStyle()}"><tr>
      <td class="px" align="center" bgcolor="${T.wash}" style="background-color:${T.wash};border-top:1px solid ${T.border};padding:24px 40px;font-family:${FONT};font-size:12px;color:${T.muted};line-height:1.7;text-align:center;">
        Internal notification for the Naya Lumière Cosmetics team &middot; ${textLink(`${BASE}/admin`, 'Open admin')}
      </td>
    </tr></table>`;
  }

  const link = (label, path) => `<a href="${BASE}${path}" style="color:${T.inkSoft};text-decoration:none;font-weight:500;">${label}</a>`;
  return `
    <table ${TABLE} style="${tableStyle()}"><tr>${TRUST.map(text => `
      <td width="33%" align="center" valign="top" style="width:33%;padding:18px 6px;border-top:1px solid ${T.border};font-family:${FONT};font-size:12px;font-weight:500;color:${T.inkSoft};line-height:1.5;text-align:center;"><span style="color:${T.violet};font-weight:800;">&#10003;</span><br>${text}</td>`).join('')}
    </tr></table>
    <table ${TABLE} style="${tableStyle()}"><tr>
      <td class="px" align="center" bgcolor="${T.wash}" style="background-color:${T.wash};border-top:1px solid ${T.border};padding:30px 40px 34px;font-family:${FONT};text-align:center;">
        <p style="font-size:14px;color:${T.ink};font-weight:600;margin:0 0 4px;line-height:1.6;">Need a hand?</p>
        <p style="font-size:13px;color:${T.inkSoft};margin:0 0 20px;line-height:1.6;">Just reply to this email, or chat with our skincare team at ${textLink(BASE, 'nayalc.com')}.</p>
        <p style="font-size:12px;margin:0 0 18px;line-height:1.8;">${link('Shop', '/all-products')} &nbsp;&middot;&nbsp; ${link('My orders', '/account/orders')} &nbsp;&middot;&nbsp; ${link('Account', '/account')} &nbsp;&middot;&nbsp; ${link('Privacy', '/privacy')} &nbsp;&middot;&nbsp; ${link('Terms', '/terms')}</p>
        ${note ? `<p style="font-size:11px;color:${T.muted};margin:0 0 10px;line-height:1.6;">${note}</p>` : ''}
        <p style="font-size:11px;color:${T.faint};margin:0;line-height:1.6;">&copy; ${new Date().getFullYear()} Naya Lumière Cosmetics &middot; Dubai, United Arab Emirates</p>
      </td>
    </tr></table>`;
};

/**
 * The one layout every email uses.
 *
 * @param {object}  o
 * @param {string}  o.title      <title>, also used by some clients as a label
 * @param {string}  o.preheader  inbox preview line (escaped here)
 * @param {string}  o.body       the main content, already-built markup
 * @param {'customer'|'admin'} [o.audience='customer']  picks header and footer
 * @param {string}  [o.strip]    trusted markup for the purple strip
 * @param {string}  [o.hero]     full-bleed markup between header and body
 * @param {string}  [o.after]    full-bleed markup after the body (e.g. a recommendation band)
 * @param {string}  [o.footerNote] small print, e.g. why a marketing email was received
 */
export function renderEmail({ title, preheader = '', body, audience = 'customer', strip = '', hero = '', after = '', footerNote = '' }) {
  // Pads the preview text so clients don't pull body copy in after it
  const previewPad = '&#847;&zwnj;&nbsp;'.repeat(60);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><!--<![endif]-->
  <!--[if mso]><style>body,table,td,p,a,span,div,h1{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
  <style>
    body{margin:0!important;padding:0!important;width:100%!important;background-color:${T.page};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table{border-collapse:collapse;}
    img{-ms-interpolation-mode:bicubic;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u + #body a{color:inherit;text-decoration:none;}
    @media only screen and (max-width:620px){
      .shell{width:100%!important;}
      .outer{padding:0!important;}
      .card{border-radius:0!important;border-left:0!important;border-right:0!important;}
      .px{padding-left:22px!important;padding-right:22px!important;}
      .hide-mobile{display:none!important;max-height:0!important;overflow:hidden!important;}
      .h1{font-size:24px!important;}
      .stack{display:block!important;width:100%!important;padding:0 0 10px!important;}
      .stack table{width:100%!important;}
      .hero-pad{padding:48px 22px 28px!important;}
      .hero-title{font-size:34px!important;}
      .pc-img{padding:10px 10px 0!important;}
      .pc-body{padding:10px 8px 12px!important;}
      .pc-brand{font-size:9px!important;letter-spacing:0.06em!important;}
      .pc-name{font-size:11px!important;letter-spacing:0.02em!important;}
    }
  </style>
</head>
<body id="body" style="margin:0;padding:0;background-color:${T.page};">
  ${preheader ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${T.page};">${escapeHtml(preheader)}${previewPad}</div>` : ''}
  <table ${TABLE} bgcolor="${T.page}" style="${tableStyle(`background-color:${T.page};`)}"><tr>
    <td class="outer" align="center" style="padding:28px 12px 40px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
      <table class="shell" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:600px;border-collapse:collapse;">
        <tr><td class="card" bgcolor="${T.card}" style="background-color:${T.card};border:1px solid ${T.border};border-radius:12px;overflow:hidden;padding:0;">
          ${strip}
          ${header(audience)}
          ${hero}
          <table ${TABLE} style="${tableStyle()}"><tr>
            <td class="px" style="padding:36px 40px 40px;font-family:${FONT};color:${T.inkSoft};">${body}</td>
          </tr></table>
          ${after}
          ${footer(audience, footerNote)}
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr></table>
</body>
</html>`;
}
