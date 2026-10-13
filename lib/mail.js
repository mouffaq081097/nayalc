import nodemailer from 'nodemailer';
import { vatFromGross } from './vat.js';
import { formatPhone, toTel } from './phone.js';
import { fetchTabbyPlan, tabbyPlanText } from './tabby.js';
import { courierLabel, trackingUrl } from './courier.js';
import { generateInvoicePdf } from './invoicePdf.js';
import {
  BASE, LOGO_URL, FROM, T, FONT, TONES,
  escapeHtml, safeUrl, money, dubaiTime, dubaiDate, plural,
  button, buttonRow, textLink, paragraph,
  intro, section, notice, panel, infoRow, infoTable, lineItems, totals,
  addressLines, tracker, codeTicket, fallbackLink, productGrid, recommendations,
  signOff, topStrip, renderEmail,
} from './email/theme.js';

// Every email is a pure `buildXEmail(...)` returning { subject, html }, plus a
// `sendXEmail(...)` that adds recipients and hands it to SMTP. The builders can
// be rendered without a database or mail server — see scripts/preview-emails.mjs.

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls:    { rejectUnauthorized: false },
});

// One send path for every email, so logging and the return shape stay uniform.
// `build` may be async; anything it throws is reported like an SMTP failure.
async function deliver(label, to, build, extra = {}) {
  try {
    const { subject, html, attachments } = await build();
    await transporter.sendMail({ from: FROM(), to, subject, html, ...(attachments ? { attachments } : {}), ...extra });
    return { success: true };
  } catch (error) {
    console.error(`${label} email error${typeof to === 'string' ? ` (${to})` : ''}:`, error);
    return { success: false, error: error.message };
  }
}

// ── Live product suggestions ───────────────────────────────────────────────
// db is imported lazily so the builders (and the preview script) never need a
// database connection.
async function fetchProductsForEmail(limit = 3) {
  try {
    const { default: db } = await import('./db.js');
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

const greetingName = (firstName) => escapeHtml(String(firstName || '').trim() || 'there');

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT WORDING — shared by the confirmation, the admin alert and the invoice
// ═══════════════════════════════════════════════════════════════════════════

// One definition per payment method, worded for whoever is reading it: the
// packer needs to know whether to collect money, the customer whether they
// still owe any.
const PAYMENT_COPY = {
  cashOnDelivery: {
    label: 'Cash on delivery', tone: 'warning',
    admin: 'Collect payment on handover',
    customer: 'Please have the exact amount ready for the courier',
  },
  card: {
    label: 'Card', tone: 'success',
    admin: 'Paid online',
    customer: 'Paid in full — nothing to pay on delivery',
  },
  // The plan varies (4, 6, 12 months…), so the wording comes from paymentCopy() with the real plan
  tabby: {
    label: 'Tabby', tone: 'success',
    admin: 'Paid by Tabby · settled to us in full',
    customer: 'Paid with Tabby · your payment schedule is in your Tabby app',
  },
};

// The copy for a payment method; for Tabby, worded for the plan the customer chose (lib/tabby.js tabbyPlan)
const paymentCopy = (method, tabbyPlan = null) => {
  const copy = PAYMENT_COPY[method];
  const plan = method === 'tabby' ? tabbyPlanText(tabbyPlan) : null;
  if (!copy || !plan) return copy;
  return {
    ...copy,
    label: `Tabby · ${plan}`,
    customer: `Paid with Tabby in ${plan} · your payment schedule is in your Tabby app`,
  };
};

const paymentLabel = (method, tabbyPlan = null) => paymentCopy(method, tabbyPlan)?.label || method || '';

/**
 * The loudest block in either order email: is there money still to move?
 * `audience` picks the wording — 'admin' or 'customer'.
 */
const paymentBanner = (paymentMethod, total, audience, tabbyPlan = null) => {
  const payment = paymentCopy(paymentMethod, tabbyPlan)
    || (paymentMethod ? { label: paymentMethod, tone: 'neutral', admin: '', customer: '' } : null);
  const tone = payment?.tone || 'neutral';

  const fallback = audience === 'admin'
    ? 'Check the order in admin before dispatch'
    : 'We will confirm your payment shortly';

  const body = paymentMethod === 'cashOnDelivery' && audience === 'admin'
    ? `Collect <strong style="font-weight:800;">${money(total)}</strong> on handover`
    : paymentMethod === 'cashOnDelivery'
      ? `Please have <strong style="font-weight:800;">${money(total)}</strong> ready for the courier`
      : escapeHtml(payment?.[audience] || fallback);

  return notice({
    tone,
    title: escapeHtml(payment ? payment.label : 'Payment method not recorded'),
    body,
  });
};

const ORDER_STEPS = ['Placed', 'Preparing', 'Shipped', 'Delivered'];

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT EMAILS
// ═══════════════════════════════════════════════════════════════════════════

export function buildWelcomeEmail(firstName, suggestions = []) {
  const body = `
    ${intro({
      eyebrow: 'Welcome to Naya Lumière',
      heading: `Welcome, ${greetingName(firstName)}`,
      lead: 'Your account is ready. Discover clinical skincare from GERnétic and Zorah, and our own Naya Lumière fragrances, all delivered across the UAE.',
    })}
    ${notice({
      tone: 'info',
      title: '500 points added',
      body: 'A welcome gift from us. Your points are waiting in your account to use on your first order.',
    })}
    ${section('What you can do now', infoTable([
      infoRow('Shop', 'GERnétic, Zorah and Naya Lumière Perfumes, all from an official retailer'),
      infoRow('Skin quiz', 'Find the routine that suits your skin in two minutes'),
      infoRow('Rewards', 'Earn points on every order and redeem them at checkout'),
    ]))}
    <div style="margin-top:32px;">${buttonRow({ href: `${BASE}/all-products`, label: 'Start shopping' }, { href: `${BASE}/account`, label: 'My account' })}</div>
    ${recommendations(suggestions, 'Start your routine')}
    ${signOff()}`;

  return {
    subject: 'Welcome to Naya Lumière — 500 points are waiting',
    html: renderEmail({
      title: 'Welcome to Naya Lumière',
      preheader: 'Your account is ready, and 500 welcome points are already in it.',
      strip: topStrip('Welcome gift &middot; 500 points added to your account'),
      body,
    }),
  };
}

export async function sendWelcomeEmail(email, firstName) {
  return deliver('Welcome', email, async () => buildWelcomeEmail(firstName, await fetchProductsForEmail(3)));
}

// Security notice: deliberately no product strip, so it reads as a security
// message rather than marketing, and costs no database round-trip per sign-in.
export function buildLoginConfirmationEmail(firstName, signedInAt = null) {
  const body = `
    ${intro({
      badge: '&#10003;', badgeTone: 'success',
      eyebrow: 'Security notice',
      heading: 'New sign-in to your account',
      lead: `Hi ${greetingName(firstName)}, someone just signed in to your Naya Lumière account. If that was you, there's nothing more to do.`,
    })}
    ${section('Sign-in details', infoTable([
      infoRow('When', `${escapeHtml(dubaiTime(signedInAt))} <span style="color:${T.muted};">Dubai time</span>`),
    ]))}
    ${notice({
      tone: 'warning',
      title: "Wasn't you?",
      body: 'Change your password straight away to secure your account, then reply to this email so we can help.',
    })}
    <div style="margin-top:28px;">${buttonRow({ href: `${BASE}/account/settings`, label: 'Change password' }, { href: `${BASE}/account`, label: 'My account' })}</div>`;

  return {
    subject: 'New sign-in to your Naya Lumière account',
    html: renderEmail({
      title: 'New sign-in',
      preheader: 'A new sign-in to your account was just recorded. If it was you, no action is needed.',
      body,
    }),
  };
}

export async function sendLoginConfirmationEmail(email, firstName) {
  return deliver('Login confirmation', email, () => buildLoginConfirmationEmail(firstName));
}

export function buildPasswordResetEmail(firstName, resetUrl) {
  const body = `
    ${intro({
      badge: '&#9919;', badgeTone: 'info',
      eyebrow: 'Account security',
      heading: 'Reset your password',
      lead: `Hi ${greetingName(firstName)}, we received a request to reset the password for your Naya Lumière account. Tap the button below to choose a new one.`,
    })}
    <div style="margin-top:28px;">${button(resetUrl, 'Choose a new password')}</div>
    ${notice({
      tone: 'neutral',
      body: `This link expires in <strong style="color:${T.ink};">1 hour</strong> and can be used once. If you didn't ask for a reset, you can safely ignore this email; your password won't change.`,
    })}
    ${fallbackLink(resetUrl)}`;

  return {
    subject: 'Reset your password — Naya Lumière',
    html: renderEmail({
      title: 'Reset your password',
      preheader: 'Use this link within the hour to choose a new password.',
      body,
    }),
  };
}

// No product strip here: this email is time-critical and the strip costs an
// ORDER BY RANDOM() scan over products before we can even send.
export async function sendPasswordResetEmail(email, firstName, resetUrl) {
  return deliver('Password reset', email, () => buildPasswordResetEmail(firstName, resetUrl));
}

export function buildEmailVerificationEmail(firstName, verifyUrl) {
  const body = `
    ${intro({
      badge: '&#9993;', badgeTone: 'info',
      eyebrow: 'One last step',
      heading: 'Confirm your email',
      lead: `Hi ${greetingName(firstName)}, please confirm this is your email address so we can send your order updates and keep your account secure.`,
    })}
    <div style="margin-top:28px;">${button(verifyUrl, 'Confirm my email')}</div>
    ${notice({
      tone: 'neutral',
      body: `This link expires in <strong style="color:${T.ink};">24 hours</strong>. If you didn't create an account, you can safely ignore this email.`,
    })}
    ${fallbackLink(verifyUrl)}`;

  return {
    subject: 'Confirm your email — Naya Lumière',
    html: renderEmail({
      title: 'Confirm your email',
      preheader: 'One tap to confirm your email address and finish setting up your account.',
      body,
    }),
  };
}

// Deliberately no product strip — see sendPasswordResetEmail.
export async function sendEmailVerificationEmail(email, firstName, verifyUrl) {
  return deliver('Verification', email, () => buildEmailVerificationEmail(firstName, verifyUrl));
}

export function buildSubscriptionConfirmationEmail(suggestions = []) {
  const body = `
    ${intro({
      eyebrow: 'Newsletter',
      heading: "You're on the list",
      lead: "Thanks for subscribing. You'll be first to hear about new arrivals, restocks and members-only offers.",
    })}
    ${section('What to expect', infoTable([
      infoRow('Offers', 'Members-only discounts, sent to subscribers first'),
      infoRow('New arrivals', 'Early access to launches and restocks'),
      infoRow('Skincare tips', 'Routines and advice from our skincare team'),
    ]))}
    <div style="margin-top:32px;">${button(`${BASE}/all-products`, 'Explore the collection')}</div>
    ${recommendations(suggestions, 'Your first discovery')}
    ${signOff()}`;

  return {
    subject: "You're on the list — Naya Lumière",
    html: renderEmail({
      title: 'Subscription confirmed',
      preheader: 'Members-only offers, new arrivals and restocks, straight to your inbox.',
      body,
      footerNote: "You're receiving this because you subscribed to the Naya Lumière Cosmetics newsletter.",
    }),
  };
}

export async function sendSubscriptionConfirmationEmail(email) {
  return deliver('Subscription', email, async () => buildSubscriptionConfirmationEmail(await fetchProductsForEmail(3)));
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDER EMAILS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Builds the customer order confirmation. Split from the send so it can be
 * previewed without SMTP, as the fulfilment alert is.
 */
export function buildOrderConfirmationEmail(
  firstName, orderId, total_amount, taxAmount, discountAmount, subtotal,
  shippingCost, itemsWithDetails = [], shippingAddress, giftWrapCost,
  couponCode = null, paymentMethod = null, placedAt = null, suggestions = [],
  preorderShipBy = null, tabbyPlan = null
) {
  const address   = shippingAddress || {};
  const items     = itemsWithDetails || [];
  const unitCount = items.reduce((count, item) => count + Number(item.quantity || 0), 0);
  const orderUrl  = `${BASE}/account/orders/${encodeURIComponent(orderId)}`;

  const body = `
    ${intro({
      badge: '&#10003;', badgeTone: 'success',
      eyebrow: `Order #${escapeHtml(orderId)}`,
      heading: `Thank you, ${greetingName(firstName)}`,
      lead: preorderShipBy
        ? "Your order is confirmed. Part of it is on pre-order, so we'll send everything together as soon as it arrives."
        : "Your order is confirmed and we're getting it ready. We'll email you again the moment it ships.",
    })}
    ${tracker(ORDER_STEPS, 0)}
    ${preorderShipBy ? notice({
      tone: 'info',
      title: `Pre-order &middot; ships by ${escapeHtml(preorderShipBy)}`,
      body: "We'll keep your order together and send it in one parcel once the pre-ordered items reach us. We'll email you as soon as it's on its way, and if anything changes we'll tell you straight away.",
    }) : ''}
    ${paymentBanner(paymentMethod, total_amount, 'customer', tabbyPlan)}

    ${section(`Your order${unitCount ? ` &middot; ${plural(unitCount, 'item')}` : ''}`, `
      ${lineItems(items)}
      ${totals({ subtotal, shippingCost, giftWrapCost, taxAmount, discountAmount, couponCode, total: total_amount })}`)}

    ${section('Delivering to', panel(addressLines(address) || 'No address on file.', { margin: '14px 0 0' }))}

    ${section('Order details', infoTable([
      infoRow('Order number', `<strong style="font-weight:700;">#${escapeHtml(orderId)}</strong>`),
      infoRow('Placed', `${escapeHtml(dubaiTime(placedAt))} <span style="color:${T.muted};">Dubai time</span>`),
      infoRow('Payment', escapeHtml(paymentLabel(paymentMethod, tabbyPlan))),
    ]))}

    <div style="margin-top:32px;">${button(orderUrl, 'View my order')}</div>
    ${recommendations(suggestions, 'Complete your routine')}
    ${signOff()}`;

  const preheader = [
    unitCount ? `${plural(unitCount, 'item')} on the way` : 'Order confirmed',
    money(total_amount),
    address.city,
  ].filter(Boolean).join(' · ');

  return {
    subject: `Order #${orderId} confirmed — Naya Lumière`,
    html: renderEmail({
      title: `Order #${orderId} confirmed`,
      preheader,
      strip: topStrip(`Order #${escapeHtml(orderId)} confirmed &middot; thank you for shopping with us`),
      body,
    }),
  };
}

export async function sendOrderConfirmationEmail(
  email, firstName, orderId, total_amount, taxAmount,
  discountAmount, subtotal, shippingCost, itemsWithDetails,
  shippingAddress, giftWrapCost, couponCode = null, paymentMethod = null, placedAt = null,
  preorderShipBy = null, tabbyPaymentId = null
) {
  return deliver('Order confirmation', email, async () => buildOrderConfirmationEmail(
    firstName, orderId, total_amount, taxAmount, discountAmount, subtotal,
    shippingCost, itemsWithDetails, shippingAddress, giftWrapCost,
    couponCode, paymentMethod, placedAt, await fetchProductsForEmail(3), preorderShipBy,
    paymentMethod === 'tabby' ? await fetchTabbyPlan(tabbyPaymentId) : null
  ));
}

// Per-status wording and tracker position for the status update email.
// Statuses not listed here fall back to a plain "your order is now X".
const STATUS_COPY = {
  Pending: {
    step: 0, eyebrow: 'Order received', heading: "We've received your order",
    lead: "Thank you. We'll confirm the details and start preparing it shortly.",
  },
  Processing: {
    step: 1, eyebrow: 'Being prepared', heading: 'Your order is being prepared',
    lead: "Our team is carefully packing your order. We'll let you know as soon as it ships.",
  },
  Shipped: {
    step: 2, eyebrow: 'On its way', heading: 'Your order has shipped',
    lead: "Good news: your order is on its way. You'll find tracking details below.",
  },
  Delivered: {
    step: 3, eyebrow: 'Delivered', heading: 'Your order has arrived',
    lead: 'We hope you love it. Your invoice is attached to this email for your records.',
  },
  Cancelled: {
    tone: 'danger', eyebrow: 'Order cancelled', heading: 'Your order has been cancelled',
    lead: "This order won't be delivered. If you have any questions, just reply to this email and we'll help.",
  },
  'Payment Failed': {
    step: 0, failed: true, tone: 'danger', eyebrow: 'Payment not completed', heading: "Your payment didn't go through",
    lead: "Your order hasn't been placed yet. Your bag is still saved, so you can try again in a moment.",
  },
};

export function buildOrderStatusUpdateEmail({
  firstName, orderId, newStatus, cancellationReason,
  trackingNumber, courierName, courierWebsite, pointsEarned, items = [], suggestions = [],
}) {
  const copy = STATUS_COPY[newStatus] || {
    eyebrow: 'Order update', heading: `Your order is now ${escapeHtml(newStatus)}`,
    lead: "Here's the latest on your order.",
  };
  const orderUrl  = `${BASE}/account/orders/${encodeURIComponent(orderId)}`;
  const isFailure = newStatus === 'Payment Failed';
  const isCancel  = newStatus === 'Cancelled';
  const showTracking = trackingNumber || courierName;
  const courier = courierLabel(courierName);
  const trackUrl = trackingUrl({ courierName, trackingNumber, courierWebsite });

  const reasonBlock = (isCancel || isFailure) && cancellationReason
    ? notice({ tone: 'danger', title: isCancel ? 'Reason' : 'What happened', body: escapeHtml(cancellationReason) })
    : '';

  const trackingBlock = showTracking ? section('Tracking', infoTable([
    infoRow('Courier', escapeHtml(courier)),
    infoRow('Tracking number', trackingNumber ? `<strong style="font-weight:700;letter-spacing:0.02em;">${escapeHtml(trackingNumber)}</strong>` : ''),
    infoRow('Track', trackUrl ? textLink(trackUrl, `Track on ${courier || 'the courier'}’s website`) : ''),
  ])) : '';

  const pointsBlock = newStatus === 'Delivered' && Number(pointsEarned) > 0
    ? notice({
        tone: 'info',
        title: `You earned ${Number(pointsEarned)} points`,
        body: 'They are already in your account, ready to redeem on your next order.',
      })
    : '';

  const cta = isFailure
    ? buttonRow({ href: `${BASE}/cart`, label: 'Try again' }, { href: `${BASE}/account/orders`, label: 'My orders' })
    : newStatus === 'Shipped' && trackUrl
      ? buttonRow({ href: trackUrl, label: courier ? `Track with ${courier}` : 'Track parcel' }, { href: orderUrl, label: 'View order' })
      : newStatus === 'Delivered'
        ? buttonRow({ href: orderUrl, label: 'View order' }, { href: `${BASE}/account/loyalty`, label: 'My rewards' })
        : button(orderUrl, 'View order');

  const body = `
    ${intro({
      eyebrow: `${escapeHtml(copy.eyebrow)} &middot; Order #${escapeHtml(orderId)}`,
      heading: copy.heading,
      lead: `Hi ${greetingName(firstName)}, ${copy.lead.charAt(0).toLowerCase()}${copy.lead.slice(1)}`,
    })}
    ${copy.step != null ? tracker(ORDER_STEPS, copy.step, { failed: copy.failed }) : ''}
    ${reasonBlock}
    ${pointsBlock}
    ${trackingBlock}
    ${items && items.length ? section('In this order', lineItems(items)) : ''}
    <div style="margin-top:32px;">${cta}</div>
    ${isFailure || isCancel ? '' : recommendations(suggestions, newStatus === 'Delivered' ? 'Refresh your routine' : 'While you wait')}
    ${signOff()}`;

  const strip = isFailure || isCancel ? '' : topStrip(`Order #${escapeHtml(orderId)} &middot; ${escapeHtml(copy.eyebrow)}`);

  return {
    subject: isFailure
      ? `Payment not completed for order #${orderId} — Naya Lumière`
      : `${STATUS_COPY[newStatus] ? copy.heading : `Order #${orderId} is now ${newStatus}`} — #${orderId}`,
    html: renderEmail({
      title: `Order #${orderId} · ${newStatus}`,
      preheader: [copy.eyebrow, `Order #${orderId}`, trackingNumber && `Tracking ${trackingNumber}`].filter(Boolean).join(' · '),
      strip,
      body,
    }),
  };
}

export async function sendOrderStatusUpdateEmail(
  email, firstName, orderId, newStatus, cancellationReason,
  _totalAmount, _taxAmount, _discountAmount, _subtotal, _shippingCost,
  itemsWithDetails, _shippingAddress, trackingNumber, courierName,
  courierWebsite, orderDetails, pointsEarned
) {
  return deliver('Status update', email, async () => {
    const quiet = newStatus === 'Payment Failed' || newStatus === 'Cancelled';
    const message = buildOrderStatusUpdateEmail({
      firstName, orderId, newStatus, cancellationReason,
      trackingNumber, courierName, courierWebsite, pointsEarned,
      items: itemsWithDetails || [],
      suggestions: quiet ? [] : await fetchProductsForEmail(3),
    });
    // The payment-failure webhooks have no order details to invoice; sending
    // without the attachment beats not sending at all.
    if (orderDetails) {
      const tabbyPlan = orderDetails.paymentMethod === 'tabby' ? await fetchTabbyPlan(orderDetails.tabbyPaymentId) : null;
      message.attachments = [await invoiceAttachment({ ...orderDetails, tabbyPlan, status: orderDetails.status || newStatus })];
    }
    return message;
  });
}

// ── Pre-orders ────────────────────────────────────────────────────────────
// A pre-order waits under "Awaiting stock" until its units arrive (lib/backorders.js).

const preorderCancelLink = (orderId) =>
  `${BASE}/account/orders/${encodeURIComponent(orderId)}`;

/** The pre-ordered stock arrived and the order is being packed. */
export function buildPreorderReadyEmail({ firstName, orderId, items = [] }) {
  const orderUrl = `${BASE}/account/orders/${encodeURIComponent(orderId)}`;
  const body = `
    ${intro({
      badge: '&#10003;', badgeTone: 'success',
      eyebrow: `Order #${escapeHtml(orderId)}`,
      heading: 'Your pre-order has arrived',
      lead: `Hi ${greetingName(firstName)}, everything in your order is now with us and we're packing it. We'll email you tracking details as soon as it ships.`,
    })}
    ${tracker(ORDER_STEPS, 1)}
    ${items.length ? section('In this order', lineItems(items)) : ''}
    <div style="margin-top:32px;">${button(orderUrl, 'View order')}</div>
    ${signOff()}`;
  return {
    subject: `Your pre-order is in — order #${orderId}`,
    html: renderEmail({
      title: `Order #${orderId} · pre-order arrived`,
      preheader: `Order #${orderId} is being packed`,
      strip: topStrip(`Order #${escapeHtml(orderId)} &middot; pre-order arrived`),
      body,
    }),
  };
}

export async function sendPreorderReadyEmail(email, details) {
  return deliver('Pre-order ready', email, () => buildPreorderReadyEmail(details));
}

/** The promised ship date passed with the stock still on its way. */
export function buildPreorderDelayEmail({ firstName, orderId, items = [], newShipBy }) {
  const body = `
    ${intro({
      eyebrow: `Order #${escapeHtml(orderId)}`,
      heading: 'Your pre-order is taking a little longer',
      lead: `Hi ${greetingName(firstName)}, we're sorry: the pre-ordered items in your order haven't reached us yet, so it won't ship on the date we gave you.`,
    })}
    ${notice({
      tone: 'warning',
      title: `New estimate &middot; ships by ${escapeHtml(newShipBy)}`,
      body: "We'll email you the moment it's on its way. If you'd rather not wait, you can cancel the order from your account for a full refund.",
    })}
    ${items.length ? section('Still to arrive', lineItems(items)) : ''}
    <div style="margin-top:32px;">${button(preorderCancelLink(orderId), 'View or cancel order')}</div>
    ${signOff()}`;
  return {
    subject: `An update on your pre-order — order #${orderId}`,
    html: renderEmail({
      title: `Order #${orderId} · pre-order delayed`,
      preheader: `New estimate: ships by ${newShipBy}`,
      body,
    }),
  };
}

export async function sendPreorderDelayEmail(email, details) {
  return deliver('Pre-order delay', email, () => buildPreorderDelayEmail(details));
}

const adminOrderRow = (order, value) => infoRow(
  `<a href="${safeUrl(`${BASE}/admin/orders/${encodeURIComponent(order.orderId)}`)}" style="color:${T.violet};text-decoration:none;font-weight:700;">#${escapeHtml(order.orderId)}</a>`,
  value,
);

/**
 * One internal email for pre-order events: orders released by a restock
 * (`ready`), orders past their promised date (`late`), or an order the
 * customer cancelled while waiting (`cancelled`).
 */
export function buildPreorderAdminEmail({ ready = [], late = [], cancelled = null }) {
  const blocks = [];
  if (cancelled) {
    blocks.push(notice({
      tone: cancelled.paymentMethod === 'tabby' ? 'danger' : 'info',
      title: `Order #${escapeHtml(cancelled.orderId)} cancelled by the customer`,
      body: cancelled.paymentMethod === 'tabby'
        ? `They cancelled while waiting for stock. <strong style="font-weight:800;">Refund ${money(cancelled.total)} on Tabby</strong> — Tabby payments are not refunded automatically.`
        : cancelled.paymentMethod === 'card'
          ? `They cancelled while waiting for stock. The card payment of ${money(cancelled.total)} was refunded on Stripe.`
          : 'They cancelled while waiting for stock. Nothing was paid, so there is nothing to refund.',
    }));
  }
  if (ready.length) {
    blocks.push(section(`Ready to ship &middot; ${plural(ready.length, 'order')}`, infoTable(
      ready.map(order => adminOrderRow(order, `${escapeHtml(order.customerName || 'Customer')} &middot; all pre-ordered units are now allocated`)),
    )));
  }
  if (late.length) {
    blocks.push(section(`Past their promised date &middot; ${plural(late.length, 'order')}`, infoTable(
      late.map(order => adminOrderRow(order, `${escapeHtml(order.customerName || 'Customer')} &middot; ${escapeHtml(order.waitingFor || '')}<br><span style="color:${T.muted};">Was due ${escapeHtml(order.wasDue)}; customer told ${escapeHtml(order.newShipBy)}</span>`)),
    )));
  }

  const heading = cancelled
    ? `Pre-order #${escapeHtml(cancelled.orderId)} cancelled`
    : ready.length && !late.length
      ? `${plural(ready.length, 'pre-order')} ready to ship`
      : `${plural(late.length, 'pre-order')} running late`;

  const body = `
    ${intro({
      eyebrow: 'Pre-orders',
      heading,
      lead: late.length ? 'The customers below have been emailed a new date and offered a refund. Chase the supplier or update the stock when it lands.' : '',
    })}
    ${blocks.join('')}
    <div style="margin-top:32px;">${button(`${BASE}/admin/backorders`, 'Open backorders')}</div>`;

  return {
    subject: `Pre-orders: ${heading.replace(/&middot;/g, '·')}`,
    html: renderEmail({ title: 'Pre-orders', preheader: heading, audience: 'admin', body }),
  };
}

export async function sendPreorderAdminEmail(details) {
  const recipients = resolveAdminRecipients();
  if (recipients.length === 0) return { success: false, skipped: true };
  return deliver('Pre-order admin', recipients.join(', '), () => buildPreorderAdminEmail(details));
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
    couponCode, placedAt, preorderShipBy, tabbyPlan = null,
  } = details;

  const address   = shippingAddress || {};
  const unitCount = items.reduce((count, item) => count + Number(item.quantity || 0), 0);

  const contactLine = [
    customerName ? `<strong style="font-weight:700;">${escapeHtml(customerName)}</strong>` : null,
    customerEmail && customerEmail !== 'Unknown' ? textLink(`mailto:${customerEmail}`, customerEmail) : null,
  ].filter(Boolean).join('<br>');

  const phoneLink = customerPhone
    ? `<a href="${safeUrl(`tel:${toTel(customerPhone) || String(customerPhone).replace(/\s+/g, '')}`)}" style="color:${T.violet};text-decoration:none;font-weight:700;">${escapeHtml(formatPhone(customerPhone))}</a>`
    : '';

  const body = `
    ${intro({
      eyebrow: 'New order &middot; action required',
      heading: `Order #${escapeHtml(orderId)} needs packing`,
      lead: `${escapeHtml(customerName || 'A customer')} placed an order for <strong style="color:${T.ink};">${money(total_amount)}</strong>. Everything you need to pick and pack it is below.`,
    })}
    ${preorderShipBy ? notice({
      tone: 'warning',
      title: 'Pre-order &middot; do not ship yet',
      body: `Some units aren't on the shelf. The order is held under Awaiting stock and released when the stock comes in. Promised to ship by <strong style="font-weight:800;">${escapeHtml(preorderShipBy)}</strong>.`,
    }) : ''}
    ${paymentBanner(paymentMethod, total_amount, 'admin', tabbyPlan)}

    ${section('Order snapshot', infoTable([
      infoRow('Order', `<strong style="font-weight:700;">#${escapeHtml(orderId)}</strong>`),
      infoRow('Placed', `${escapeHtml(dubaiTime(placedAt))} <span style="color:${T.muted};">Dubai time</span>`),
      infoRow('Customer', contactLine),
      infoRow('Phone', phoneLink),
      infoRow('To pack', unitCount ? `${plural(unitCount, 'unit')} across ${plural(items.length, 'line')}` : ''),
    ]))}

    ${items.length ? section('Items to pack', lineItems(items, { meta: true })) : ''}
    ${section('Totals', totals({ subtotal, shippingCost, giftWrapCost, taxAmount, discountAmount, couponCode, total: total_amount }))}
    ${section('Ship to', panel(addressLines(address) || 'No address on file.', { margin: '14px 0 0' }))}

    <div style="margin-top:32px;">${buttonRow(
      { href: `${BASE}/admin/orders/${encodeURIComponent(orderId)}`, label: 'Open order' },
      { href: `${BASE}/admin/orders/${encodeURIComponent(orderId)}/packing-slip`, label: 'Packing slip' },
    )}</div>`;

  const label = paymentLabel(paymentMethod, tabbyPlan);
  const subjectBits = [`Action required: order #${orderId}`, money(total_amount)];
  if (label) subjectBits.push(label);

  const preheader = [
    unitCount ? `${plural(unitCount, 'unit')} to pack` : 'New order',
    money(total_amount),
    label,
    address.city,
  ].filter(Boolean).join(' · ');

  return {
    subject: subjectBits.join(' · '),
    html: renderEmail({
      title: `New order #${orderId}`,
      preheader,
      audience: 'admin',
      strip: topStrip('Action required &middot; new order'),
      body,
    }),
  };
}

export async function sendAdminNotificationEmail(adminEmail, orderId, customerEmail, total_amount, shippingAddress, details = {}) {
  const recipients = resolveAdminRecipients(adminEmail);
  if (recipients.length === 0) {
    console.warn(`Order #${orderId}: no admin recipient configured — set ORDER_NOTIFICATION_EMAILS or ADMIN_EMAIL.`);
    return { success: false, skipped: true };
  }
  return deliver('Admin order notification', recipients.join(', '), async () => {
    const tabbyPlan = details.paymentMethod === 'tabby' ? await fetchTabbyPlan(details.tabbyPaymentId) : null;
    return buildAdminNotificationEmail(orderId, customerEmail, total_amount, shippingAddress, { ...details, tabbyPlan });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function buildChatNotificationEmail(customerName, customerEmail, conversationId, latestMessageContent) {
  const name = escapeHtml(customerName || 'A customer');
  // Customer-written text: escaped, with line breaks kept
  const message = escapeHtml(latestMessageContent).replace(/\r?\n/g, '<br>');

  const body = `
    ${intro({
      eyebrow: 'Live chat',
      heading: `New message from ${name}`,
      lead: 'A customer is waiting for a reply in the chat.',
    })}
    ${panel(`<span style="font-size:15px;color:${T.ink};">${message}</span>`, { margin: '24px 0 0', accent: true })}
    ${section('Customer', infoTable([
      infoRow('Name', name),
      infoRow('Email', customerEmail ? textLink(`mailto:${customerEmail}`, customerEmail) : ''),
    ]))}
    <div style="margin-top:32px;">${button(`${BASE}/admin/chat/${encodeURIComponent(conversationId)}`, 'Reply now')}</div>`;

  return {
    subject: `New chat message from ${customerName || 'a customer'}`,
    html: renderEmail({
      title: 'New chat message',
      preheader: String(latestMessageContent || '').slice(0, 120),
      audience: 'admin',
      body,
    }),
  };
}

export async function sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, latestMessageContent) {
  return deliver('Chat notification', adminEmail,
    () => buildChatNotificationEmail(customerName, customerEmail, conversationId, latestMessageContent));
}

export function buildPayoutRequestEmail(amount, currency, payoutId) {
  const value = `${Number(amount).toFixed(2)} ${String(currency).toUpperCase()}`;
  const body = `
    ${intro({
      eyebrow: 'Stripe payout',
      heading: `Payout of ${escapeHtml(value)} requested`,
      lead: 'A manual payout was just started from the Naya Lumière Stripe account.',
    })}
    ${section('Payout', infoTable([
      infoRow('Amount', `<strong style="font-weight:800;">${escapeHtml(value)}</strong>`),
      infoRow('Payout ID', `<span style="font-family:Menlo,Consolas,monospace;font-size:13px;">${escapeHtml(payoutId)}</span>`),
      infoRow('Status', `<span style="color:${TONES.warning.ink};font-weight:700;">Pending</span>`),
      infoRow('Requested', `${escapeHtml(dubaiTime())} <span style="color:${T.muted};">Dubai time</span>`),
    ]))}
    <div style="margin-top:32px;">${button(`${BASE}/admin/payments`, 'Review payments')}</div>`;

  return {
    subject: `Payout requested: ${value}`,
    html: renderEmail({ title: 'Payout requested', preheader: `${value} payout pending`, audience: 'admin', body }),
  };
}

export async function sendPayoutRequestNotificationEmail(recipients, amount, currency, payoutId) {
  return deliver('Payout notification', recipients.join(', '), () => buildPayoutRequestEmail(amount, currency, payoutId));
}

export function buildTransactionEmail(txDetails) {
  const { id, amount, fee, net, currency, status, type, created, source, receipt_email } = txDetails;
  const pm      = source?.payment_method;
  const pmDets  = source?.payment_method_details;
  const card    = pm?.card || pmDets?.card;
  const billing = pm?.billing_details || source?.billing_details;
  const ownerEmail = billing?.email || source?.customer?.email || receipt_email;
  const ownerName  = billing?.name  || source?.customer?.name  || 'Not provided';
  const cur = String(currency || '').toUpperCase();
  const fmt = (minor) => `${(Number(minor || 0) / 100).toFixed(2)} ${cur}`;

  const billingAddress = billing?.address?.line1
    ? [billing.address.line1, billing.address.city, billing.address.country].filter(Boolean).map(escapeHtml).join(', ')
    : '';

  const body = `
    ${intro({
      eyebrow: 'Stripe transaction',
      heading: `${fmt(net)} net`,
      lead: `${escapeHtml(String(type || '').replace(/_/g, ' '))} &middot; ${escapeHtml(status)} &middot; ${escapeHtml(dubaiTime(Number(created) * 1000))}`,
    })}
    ${section('Breakdown', `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:14px 0 0;">
        <tr><td style="padding:5px 0;font-family:${FONT};font-size:14px;color:${T.inkSoft};">Gross</td><td align="right" style="padding:5px 0;font-family:${FONT};font-size:14px;font-weight:600;color:${T.ink};text-align:right;">${fmt(amount)}</td></tr>
        <tr><td style="padding:5px 0;font-family:${FONT};font-size:14px;color:${TONES.danger.ink};">Stripe fee</td><td align="right" style="padding:5px 0;font-family:${FONT};font-size:14px;font-weight:600;color:${TONES.danger.ink};text-align:right;">&minus;${fmt(fee)}</td></tr>
        <tr><td style="padding:14px 0 0;border-top:1px solid ${T.border};font-family:${FONT};font-size:16px;font-weight:800;color:${T.ink};">Net</td><td align="right" style="padding:14px 0 0;border-top:1px solid ${T.border};font-family:${FONT};font-size:18px;font-weight:800;color:${TONES.success.ink};text-align:right;">${fmt(net)}</td></tr>
      </table>`)}
    ${section('Transaction', infoTable([
      infoRow('ID', `<span style="font-family:Menlo,Consolas,monospace;font-size:13px;">${escapeHtml(id)}</span>`),
      infoRow('Status', escapeHtml(status)),
      infoRow('Type', escapeHtml(String(type || '').replace(/_/g, ' '))),
    ]))}
    ${card ? section('Card', infoTable([
      infoRow('Card', `<strong style="font-weight:700;">${escapeHtml(card.brand || 'Card')} &bull;&bull;&bull;&bull; ${escapeHtml(card.last4 || '----')}</strong>`),
      infoRow('Expires', `${escapeHtml(card.exp_month || 'MM')}/${escapeHtml(card.exp_year || 'YY')}`),
      infoRow('Country', escapeHtml(card.country)),
    ])) : ''}
    ${section('Cardholder', infoTable([
      infoRow('Name', escapeHtml(ownerName)),
      infoRow('Email', ownerEmail ? textLink(`mailto:${ownerEmail}`, ownerEmail) : 'Not provided'),
      infoRow('Address', billingAddress),
    ]))}
    <div style="margin-top:32px;">${button(`${BASE}/admin/payments`, 'Open payments')}</div>`;

  return {
    subject: `Transaction ${id} · ${fmt(amount)}`,
    html: renderEmail({ title: 'Transaction details', preheader: `${fmt(amount)} gross · ${fmt(net)} net`, audience: 'admin', body }),
  };
}

export async function sendTransactionNotificationEmail(recipients, txDetails) {
  return deliver('Transaction notification', recipients.join(', '), () => buildTransactionEmail(txDetails));
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING EMAILS
// ═══════════════════════════════════════════════════════════════════════════

const MARKETING_NOTE = "You're receiving this because you have a Naya Lumière Cosmetics account or subscribed to our newsletter.";

// `htmlContent` is written by an admin in the campaigns screen, so it is
// trusted markup; it is dropped into the shared layout with base typography.
export function buildMarketingEmail(subject, htmlContent) {
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: String(htmlContent || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140),
      body: `<div style="font-family:${FONT};font-size:15px;line-height:1.7;color:${T.inkSoft};">${htmlContent}</div>${signOff()}`,
      footerNote: MARKETING_NOTE,
    }),
  };
}

export async function sendMarketingEmail(recipients, subject, htmlContent) {
  return deliver('Marketing', recipients.join(', '), () => buildMarketingEmail(subject, htmlContent));
}

export function buildAbandonedCartEmail(firstName, cartItems = [], suggestions = []) {
  const items = cartItems.map(item => ({ ...item, quantity: item.quantity || 1 }));
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

  const body = `
    ${intro({
      eyebrow: 'Still thinking it over?',
      heading: `Your bag is waiting, ${greetingName(firstName)}`,
      lead: "You left a few things behind. We've saved them for you, but stock is limited, so don't wait too long.",
    })}
    ${section(`In your bag &middot; ${plural(items.length, 'item')}`, `
      ${lineItems(items)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:14px 0 0;"><tr>
        <td style="font-family:${FONT};font-size:16px;font-weight:800;color:${T.ink};">Bag total</td>
        <td align="right" style="font-family:${FONT};font-size:18px;font-weight:800;color:${T.ink};text-align:right;">${money(total)}</td>
      </tr></table>`)}
    <div style="margin-top:32px;">${button(`${BASE}/cart`, 'Return to my bag')}</div>
    ${recommendations(suggestions, 'You may also love')}
    ${signOff()}`;

  return {
    subject: `${String(firstName || '').trim() ? `${String(firstName).trim()}, your` : 'Your'} bag is still waiting — Naya Lumière`,
    html: renderEmail({
      title: 'Your bag is waiting',
      preheader: `${plural(items.length, 'item')} saved in your bag · ${money(total)}`,
      strip: topStrip('Free delivery on 3+ items &middot; Official GERnétic &amp; Zorah retailer'),
      body,
      footerNote: MARKETING_NOTE,
    }),
  };
}

export async function sendAbandonedCartEmail(email, firstName, cartItems) {
  return deliver('Abandoned cart', email, async () => buildAbandonedCartEmail(firstName, cartItems, await fetchProductsForEmail(3)));
}

// ── Stock clearance campaign ───────────────────────────────────────────────

// Outlined white pill — the homepage hero CTA
const heroButton = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0;"><tr><td style="border:1px solid #ffffff;border-radius:999px;padding:0;"><a href="${safeUrl(href)}" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;

export function buildStockClearanceEmail({ firstName, code, discountPercent, expiresAt, heroImage, products = [] }) {
  const safeCode  = escapeHtml(code);
  const expiry    = expiresAt ? dubaiDate(expiresAt) : null;
  const subject   = `${discountPercent}% off what's left in stock — Naya Lumière`;
  const preheader = `Your ${discountPercent}% code ${code} is inside — the last of our stock, while it lasts.`;
  const greeting  = firstName ? `${escapeHtml(firstName)}, we're` : "We're";
  const shopUrl   = `${BASE}/all-products`;

  const strip = topStrip(`Use code <span style="display:inline-block;background-color:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:1px 10px;font-weight:700;letter-spacing:0.04em;">${safeCode}</span> for ${discountPercent}% off &middot; Free delivery on 3+ items`);

  // Full-bleed photo with a dark scrim and white uppercase type, like the homepage hero.
  // Where background images are blocked (e.g. Outlook desktop) the dark bgcolor keeps the text readable.
  const heroBackground = heroImage
    ? `background="${escapeHtml(heroImage)}" style="background-color:#2a2a31;background-image:url('${escapeHtml(heroImage)}');background-size:cover;background-position:center;padding:0;"`
    : 'style="background-color:#2a2a31;padding:0;"';
  const hero = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
      <td bgcolor="#2a2a31" valign="bottom" ${heroBackground}>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
          <td class="hero-pad" valign="bottom" style="height:300px;background-color:rgba(17,17,20,0.30);background-image:linear-gradient(90deg,rgba(17,17,20,0.55) 0%,rgba(17,17,20,0.20) 70%,rgba(17,17,20,0) 100%);padding:64px 40px 40px;font-family:${FONT};">
            <p style="font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.9);margin:0 0 10px;line-height:1.4;">Members' offer &middot; ${discountPercent}% off</p>
            <p class="hero-title" style="font-size:44px;font-weight:900;letter-spacing:0.02em;text-transform:uppercase;color:#ffffff;margin:0;line-height:1.05;">The last<br>pieces</p>
            <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.9);margin:14px 0 24px;line-height:1.6;max-width:380px;">${greeting} down to the final units of some of our favourite GERnétic, Zorah and Naya Lumière pieces. Enjoy ${discountPercent}% off before they're gone.</p>
            ${heroButton(shopUrl, 'Shop the offer')}
          </td>
        </tr></table>
      </td>
    </tr></table>`;

  // Mirrors the homepage welcome popup
  const codeCard = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
      <td align="center" style="border:1px solid ${T.border};border-radius:8px;padding:32px 24px 30px;font-family:${FONT};">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${T.violet};margin:0 0 12px;line-height:1.4;">Members' offer</p>
        <p style="font-size:26px;font-weight:800;color:${T.ink};margin:0 0 20px;line-height:1.25;letter-spacing:-0.01em;">Get ${discountPercent}% off your order</p>
        ${codeTicket(code, `Enter it at checkout${expiry ? ` &middot; Valid until ${expiry}` : ''}`)}
        <div style="margin-top:22px;">${button(shopUrl, 'Shop now', { align: 'center' })}</div>
      </td>
    </tr></table>`;

  const productSection = products.length === 0 ? '' : `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:40px 0 0;"><tr>
      <td valign="bottom" style="padding:0 8px;font-family:${FONT};">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.muted};margin:0 0 4px;line-height:1.4;">While stock lasts</p>
        <p style="font-size:26px;font-weight:700;color:${T.ink};margin:0;line-height:1.2;">Still on our shelves</p>
      </td>
      <td class="hide-mobile" align="right" valign="bottom" style="padding:0 8px 4px;white-space:nowrap;font-family:${FONT};">${textLink(shopUrl, 'View all →')}</td>
    </tr></table>
    ${paragraph(`Prices below already include your ${discountPercent}%.`, { size: 13, margin: '8px 8px 4px' })}
    ${productGrid(products, { columns: 2, discountPercent })}
    <div style="margin-top:16px;">${button(shopUrl, 'Shop all products', { align: 'center' })}</div>`;

  const smallPrint = `${discountPercent}% off your order subtotal with code ${safeCode}${expiry ? `, valid until ${expiry}` : ''}, while stock lasts. ${MARKETING_NOTE}`;

  const body = `
    ${codeCard}
    ${productSection}
    ${signOff()}`;

  return { subject, html: renderEmail({ title: subject, preheader, strip, hero, body, footerNote: smallPrint }) };
}

// Sent one recipient at a time so customers never see each other's addresses
export async function sendStockClearanceEmail(email, options) {
  return deliver('Stock clearance', email, () => {
    const { subject, html } = buildStockClearanceEmail(options);
    return { subject: options.subjectPrefix ? `${options.subjectPrefix} ${subject}` : subject, html };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE — a standalone page (email attachment and /api/orders/[id]/invoice),
// styled to match the emails but laid out for A4 printing.
// ═══════════════════════════════════════════════════════════════════════════

/** The invoice as a PDF (lib/invoicePdf.js). Expects the same orderDetails as generateInvoiceHtml(). */
export function generateInvoicePdfFor(orderDetails) {
  return generateInvoicePdf({ ...orderDetails, paymentText: paymentLabel(orderDetails.paymentMethod, orderDetails.tabbyPlan) || 'Card' });
}

// The invoice for an email: a PDF, or the HTML version if the PDF can't be built
async function invoiceAttachment(orderDetails) {
  try {
    return { filename: `invoice-${orderDetails.id}.pdf`, content: await generateInvoicePdfFor(orderDetails), contentType: 'application/pdf' };
  } catch (error) {
    console.error(`Invoice PDF for order ${orderDetails.id} failed, attaching HTML instead:`, error);
    return { filename: `invoice-${orderDetails.id}.html`, content: generateInvoiceHtml(orderDetails), contentType: 'text/html' };
  }
}

export function generateInvoiceHtml(orderDetails) {
  // A UAE tax invoice must state the VAT even though the price includes it.
  // Prefer the figure recorded on the order; derive it only for legacy rows.
  const total      = Number(orderDetails.totalAmount) || 0;
  const invoiceVat = Number(orderDetails.taxAmount) > 0 ? Number(orderDetails.taxAmount) : vatFromGross(total);
  const invoiceNet = Math.round((total - invoiceVat) * 100) / 100;
  const items      = orderDetails.items || [];

  const issued = new Date(orderDetails.createdAt || Date.now());
  const orderDate = issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' });
  const orderTime = issued.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai' });

  // Cash on delivery is only settled once the courier hands it over
  const isCod  = orderDetails.paymentMethod === 'cashOnDelivery';
  const isPaid = !isCod || orderDetails.status === 'Delivered';
  const paidTone = isPaid ? TONES.success : TONES.warning;
  const paidLabel = isPaid ? 'Paid' : 'Due on delivery';

  const label = (text, align = 'left') =>
    `<div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};margin:0 0 8px;text-align:${align};">${text}</div>`;

  const th = (text, align = 'left') =>
    `<th align="${align}" style="padding:12px 10px;text-align:${align};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};background:${T.wash};">${text}</th>`;

  const rows = items.map(item => {
    const quantity = Number(item.quantity || 0);
    const price    = Number(item.price || 0);
    const td = (content, align = 'left', strong = false) =>
      `<td align="${align}" style="padding:14px 10px;border-bottom:1px solid ${T.border};font-size:14px;color:${strong ? T.ink : T.inkSoft};font-weight:${strong ? 700 : 400};text-align:${align};">${content}</td>`;
    return `<tr>${td(escapeHtml(item.name))}${td(quantity, 'center')}${td(money(price), 'right')}${td(money(price * quantity), 'right', true)}</tr>`;
  }).join('');

  const sumRow = (text, value, { strong = false, colour } = {}) => `
          <tr>
            <td style="padding:${strong ? '14px 10px 6px' : '4px 10px'};${strong ? `border-top:2px solid ${T.ink};` : ''}font-size:${strong ? 16 : 13}px;font-weight:${strong ? 800 : 400};color:${colour || (strong ? T.ink : T.inkSoft)};">${text}</td>
            <td align="right" style="padding:${strong ? '14px 10px 6px' : '4px 10px'};${strong ? `border-top:2px solid ${T.ink};` : ''}font-size:${strong ? 20 : 13}px;font-weight:${strong ? 800 : 500};color:${colour || T.ink};text-align:right;white-space:nowrap;">${value}</td>
          </tr>`;

  const hasBreakdown = orderDetails.subtotal != null;
  const customerName = String(orderDetails.customerName || '').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Invoice INV-${escapeHtml(orderDetails.id)} — Naya Lumière Cosmetics</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{font-family:${FONT};background:${T.page};margin:0;padding:32px 16px;color:${T.ink};-webkit-font-smoothing:antialiased;}
    table{border-collapse:collapse;width:100%;}
    .sheet{max-width:800px;margin:0 auto;background:#ffffff;border:1px solid ${T.border};border-radius:12px;overflow:hidden;}
    @media print{body{background:#ffffff;padding:0;}.sheet{border:0;border-radius:0;max-width:none;}.no-print{display:none!important;}}
  </style>
</head>
<body>
  <div class="sheet">
    <div style="height:6px;background:${T.promoStart};background-image:linear-gradient(90deg,${T.promoStart},${T.promoEnd});"></div>

    <table role="presentation"><tr>
      <td style="padding:32px 40px 24px;vertical-align:middle;">
        <img src="${LOGO_URL}" alt="Naya Lumière Cosmetics" width="46" height="40" style="display:block;width:46px;height:40px;margin:0 0 10px;">
        <div style="font-size:15px;font-weight:800;letter-spacing:0.04em;color:${T.ink};">Naya Lumière Cosmetics</div>
        <div style="font-size:13px;color:${T.inkSoft};line-height:1.6;">Dubai, United Arab Emirates<br>${escapeHtml(BASE.replace(/^https?:\/\//, ''))}</div>
      </td>
      <td align="right" style="padding:32px 40px 24px;vertical-align:top;text-align:right;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${T.violet};margin:0 0 6px;">Tax invoice</div>
        <div style="font-size:26px;font-weight:800;color:${T.ink};letter-spacing:-0.01em;margin:0 0 6px;">INV-${escapeHtml(orderDetails.id)}</div>
        <div style="font-size:13px;color:${T.inkSoft};">${orderDate} &middot; ${orderTime}</div>
        <div style="margin-top:12px;"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${paidTone.bg};border:1px solid ${paidTone.line};color:${paidTone.ink};font-size:12px;font-weight:700;">${paidLabel}</span></div>
      </td>
    </tr></table>

    <table role="presentation" style="border-top:1px solid ${T.border};border-bottom:1px solid ${T.border};"><tr>
      <td width="50%" style="padding:22px 40px;vertical-align:top;">
        ${label('Billed to')}
        <div style="font-size:14px;color:${T.ink};font-weight:600;line-height:1.7;">${escapeHtml(customerName || 'Customer')}</div>
        <div style="font-size:14px;color:${T.inkSoft};line-height:1.7;">${escapeHtml(orderDetails.customerEmail || '')}</div>
        ${orderDetails.shippingAddress ? `<div style="font-size:13px;color:${T.inkSoft};line-height:1.7;margin-top:4px;">${addressLines(orderDetails.shippingAddress)}</div>` : ''}
      </td>
      <td width="50%" style="padding:22px 40px;vertical-align:top;">
        ${label('Order')}
        <table role="presentation">
          <tr><td style="padding:2px 0;font-size:13px;color:${T.muted};">Order number</td><td align="right" style="padding:2px 0;font-size:13px;color:${T.ink};font-weight:600;text-align:right;">#${escapeHtml(orderDetails.id)}</td></tr>
          <tr><td style="padding:2px 0;font-size:13px;color:${T.muted};">Payment</td><td align="right" style="padding:2px 0;font-size:13px;color:${T.ink};font-weight:600;text-align:right;">${escapeHtml(paymentLabel(orderDetails.paymentMethod, orderDetails.tabbyPlan) || 'Card')}</td></tr>
          <tr><td style="padding:2px 0;font-size:13px;color:${T.muted};">Currency</td><td align="right" style="padding:2px 0;font-size:13px;color:${T.ink};font-weight:600;text-align:right;">AED</td></tr>
        </table>
      </td>
    </tr></table>

    <div style="padding:28px 40px 8px;">
      <table role="presentation">
        <thead><tr>${th('Item')}${th('Qty', 'center')}${th('Unit price', 'right')}${th('Amount', 'right')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <table role="presentation"><tr>
      <td width="45%" class="no-print" style="padding:16px 40px 32px;vertical-align:top;font-size:12px;color:${T.muted};line-height:1.7;">All prices are in UAE dirhams and include VAT at 5%.</td>
      <td style="padding:16px 30px 32px 0;vertical-align:top;">
        <table role="presentation">
          ${hasBreakdown ? sumRow('Subtotal', money(orderDetails.subtotal)) : ''}
          ${hasBreakdown ? sumRow('Delivery', Number(orderDetails.shippingCost) > 0 ? money(orderDetails.shippingCost) : 'Free') : ''}
          ${Number(orderDetails.giftWrapCost) > 0 ? sumRow('Gift wrap', money(orderDetails.giftWrapCost)) : ''}
          ${Number(orderDetails.discountAmount) > 0 ? sumRow('Discount', `&minus;${money(orderDetails.discountAmount)}`, { colour: T.price }) : ''}
          ${sumRow('Total', money(total), { strong: true })}
          ${sumRow('Net of VAT', money(invoiceNet), { colour: T.muted })}
          ${sumRow('VAT (5%)', money(invoiceVat), { colour: T.muted })}
        </table>
      </td>
    </tr></table>

    <div style="padding:22px 40px;background:${T.wash};border-top:1px solid ${T.border};text-align:center;">
      <p style="font-size:13px;color:${T.inkSoft};margin:0 0 4px;">Thank you for shopping with Naya Lumière Cosmetics.</p>
      <p style="font-size:12px;color:${T.muted};margin:0;">Questions about this invoice? Reply to your order email or visit ${escapeHtml(BASE.replace(/^https?:\/\//, ''))}.</p>
    </div>
  </div>
</body>
</html>`;
}
