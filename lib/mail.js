import nodemailer from 'nodemailer';
import db from '@/lib/db';

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

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls:    { rejectUnauthorized: false },
});

// ── Brand header — exact navbar treatment ─────────────────────────────────
// Table-based for maximum email client compatibility
const brandHeader = `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="vertical-align:middle;padding-right:8px;"><img src="${LOGO_URL}" alt="Naya Lumière" width="28" height="28" style="display:block;width:28px;height:28px;object-fit:contain;"></td><td style="vertical-align:middle;"><div style="font-size:16px;font-weight:700;letter-spacing:0.06em;color:${C.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase;line-height:1;margin:0;padding:0;">NAYA LUMIÈRE</div><div style="font-size:9px;letter-spacing:0.32em;color:${C.sub};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase;margin:3px 0 0 0;padding:0;line-height:1;">COSMETICS</div></td></tr></table>`;

// ── Flat white email wrapper — no container borders or rounded corners ─────
const emailWrapper = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
  <style>
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;color:${C.text};background-color:${C.bg};margin:0;padding:0;-webkit-font-smoothing:antialiased;}
    .wrap{width:100%;max-width:600px;margin:0 auto;background:${C.bg};}
    .hdr{padding:24px 40px;background:${C.bg};}
    .accent{height:3px;background:linear-gradient(90deg,rgb(196,167,254),rgb(147,104,236));width:100%;}
    .body{padding:40px;}
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
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">${brandHeader}</div>
    <div class="accent"></div>
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

export async function sendOrderConfirmationEmail(
  email, firstName, orderId, total_amount, taxAmount,
  discountAmount, subtotal, shippingCost, itemsWithDetails,
  shippingAddress, giftWrapCost, couponCode = null
) {
  try {
    const itemsHtml = itemsWithDetails.map(item => `
      <tr>
        <td>
          <div style="font-weight:700; color:${C.text};">${item.name}</div>
          <div style="font-size:11px; color:${C.muted}; margin-top:2px;">Qty: ${item.quantity}</div>
        </td>
        <td style="text-align:right; font-weight:700; color:${C.text};">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Order Confirmed</h2>
      <p>Thank you, ${firstName}. Order <strong style="color:${C.text};">#${orderId}</strong> is placed and our team is preparing your selection.</p>

      <div class="box">
        <div class="row"><span>Subtotal</span><span>AED ${Number(subtotal).toFixed(2)}</span></div>
        <div class="row"><span>Shipping</span><span>${formatShippingCost(shippingCost)}</span></div>
        ${giftWrapCost > 0 ? `<div class="row"><span>Gift wrap</span><span>AED ${Number(giftWrapCost).toFixed(2)}</span></div>` : ''}
        <div class="row"><span>VAT (5%)</span><span>AED ${Number(taxAmount).toFixed(2)}</span></div>
        ${discountAmount > 0 ? `<div class="row" style="color:${C.purple};font-weight:700;"><span>Discount${couponCode ? ` (${couponCode})` : ''}</span><span>−AED ${Number(discountAmount).toFixed(2)}</span></div>` : ''}
        <div class="total"><span>Total</span><span>AED ${Number(total_amount).toFixed(2)}</span></div>
      </div>

      <h3>Your Selection</h3>
      <table>
        <thead><tr><th>Product</th><th style="text-align:right;">Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <h3>Shipping To</h3>
      <div class="box" style="font-size:14px; color:${C.sub}; line-height:1.8;">
        ${shippingAddress.street}<br>
        ${shippingAddress.city}${shippingAddress.zip ? ', ' + shippingAddress.zip : ''}<br>
        ${shippingAddress.country}
      </div>

      <a href="${BASE}/account/orders" class="btn">Track Your Order</a>
      ${productSuggestionBlock(products, 'Complete the Look')}
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order #${orderId} confirmed — Naya Lumière`,
      html: emailWrapper(content, 'Order Confirmation'),
    });
    return { success: true };
  } catch (error) {
    console.error('Order email error:', error);
    return { success: false };
  }
}

export async function sendAdminNotificationEmail(_adminEmail, orderId, customerEmail, total_amount, shippingAddress) {
  try {
    const content = `
      <h2>New Order #${orderId}</h2>
      <p>A new order has been placed. Action required for fulfilment.</p>
      <div class="box">
        <div class="row"><span>Order ID</span><span style="font-weight:700; color:${C.text};">#${orderId}</span></div>
        <div class="row"><span>Customer</span><span>${customerEmail}</span></div>
        <div class="row"><span>Order value</span><span style="font-weight:800; color:${C.text};">AED ${Number(total_amount).toFixed(2)}</span></div>
      </div>
      <h3>Shipping Destination</h3>
      <div class="box" style="font-size:14px; color:${C.sub}; line-height:1.8;">
        ${shippingAddress.street}<br>
        ${shippingAddress.city}${shippingAddress.zip ? ', ' + shippingAddress.zip : ''}<br>
        ${shippingAddress.country}
      </div>
      <a href="${BASE}/admin/orders/${orderId}" class="btn">Process Order</a>
    `;
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: 'mouffaq.dalloul@gmail.com',
      subject: `New Order #${orderId} — Action Required`,
      html: emailWrapper(content, 'Admin Notification'),
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
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Reset Your Password</h2>
      <p>Hi ${firstName}, we received a request to reset the password for your Naya Lumière account. Click below — this link expires in 1 hour.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${resetUrl || '#'}" class="btn">Reset Password</a>
      </div>
      <p style="font-size:13px; color:${C.muted};">If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size:11px; color:${C.divider}; word-break:break-all;">${resetUrl || ''}</p>
      ${productSuggestionBlock(products, 'Your Sanctuary Awaits')}
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
    const products = await fetchProductsForEmail(3);
    const content = `
      <h2>Confirm Your Email</h2>
      <p>Hi ${firstName}, one last step — verify your email address to activate your Naya Lumière account. This link expires in 24 hours.</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size:13px; color:${C.muted};">If you didn't create an account, you can safely ignore this email.</p>
      <p style="font-size:11px; color:${C.divider}; word-break:break-all;">${verifyUrl}</p>
      ${productSuggestionBlock(products, 'Discover Your Ritual')}
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
