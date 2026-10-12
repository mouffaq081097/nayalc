// Renders every email to HTML files for design review, with sample data.
// No database, no SMTP: nothing is sent. Open the index.html it writes.
// Usage: node scripts/preview-emails.mjs [outputDir]
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

config({ path: '.env.local' });

const mail = await import('../lib/mail.js');

const outDir = resolve(process.argv[2] || 'email-previews');
mkdirSync(outDir, { recursive: true });

const IMG = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const products = [
  { id: 1, name: 'Hydra Prestige Serum', price: 420, brand_name: 'GERnétic', image_url: IMG, stock_quantity: 3 },
  { id: 2, name: 'Nourishing Night Cream with Argan', price: 285, brand_name: 'Zorah', image_url: IMG, stock_quantity: 12 },
  { id: 3, name: 'Lumière Eau de Parfum 50ml', price: 360, brand_name: 'Naya Lumière', image_url: IMG, stock_quantity: 4 },
  { id: 4, name: 'Gentle Cleansing Milk', price: 165, brand_name: 'GERnétic', image_url: IMG, stock_quantity: 20 },
];
const items = [
  { productId: 1, name: 'Hydra Prestige Serum', brand: 'GERnétic', quantity: 1, price: 420, imageUrl: IMG },
  { productId: 2, name: 'Nourishing Night Cream with Argan', brand: 'Zorah', quantity: 2, price: 285, imageUrl: IMG },
];
const address = { street: 'Villa 12, Al Wasl Road', city: 'Dubai', zip: '00000', state: 'Jumeirah 1', country: 'United Arab Emirates' };
const placedAt = new Date();
const orderDetails = {
  id: 10482, createdAt: placedAt, paymentMethod: 'card', customerName: 'Layla Haddad',
  customerEmail: 'layla@example.com', shippingAddress: address, subtotal: 990, discountAmount: 99,
  taxAmount: 42.43, shippingCost: 0, totalAmount: 891, items,
};

const emails = {
  'welcome':                 mail.buildWelcomeEmail('Layla', products.slice(0, 3)),
  'login-confirmation':      mail.buildLoginConfirmationEmail('Layla'),
  'password-reset':          mail.buildPasswordResetEmail('Layla', 'https://nayalc.com/auth/reset-password?token=sample'),
  'email-verification':      mail.buildEmailVerificationEmail('Layla', 'https://nayalc.com/api/auth/verify-email?token=sample'),
  'subscription':            mail.buildSubscriptionConfirmationEmail(products.slice(0, 3)),
  'order-confirmation-card': mail.buildOrderConfirmationEmail('Layla', 10482, 891, 42.43, 99, 990, 0, items, address, 0, 'WELCOME10', 'card', placedAt, products.slice(0, 3)),
  'order-confirmation-cod':  mail.buildOrderConfirmationEmail('Layla', 10483, 445, 21.19, 0, 420, 25, items.slice(0, 1), address, 0, null, 'cashOnDelivery', placedAt, products.slice(0, 3)),
  'order-confirmation-tabby':mail.buildOrderConfirmationEmail('Layla', 10484, 990, 47.14, 0, 990, 0, items, address, 0, null, 'tabby', placedAt, []),
  'status-processing':       mail.buildOrderStatusUpdateEmail({ firstName: 'Layla', orderId: 10482, newStatus: 'Processing', items, suggestions: products.slice(0, 3) }),
  'status-shipped':          mail.buildOrderStatusUpdateEmail({ firstName: 'Layla', orderId: 10482, newStatus: 'Shipped', trackingNumber: 'ARX 4471 2290', courierName: 'Aramex', courierWebsite: 'https://www.aramex.com/track', items, suggestions: products.slice(0, 3) }),
  'status-delivered':        mail.buildOrderStatusUpdateEmail({ firstName: 'Layla', orderId: 10482, newStatus: 'Delivered', pointsEarned: 89, items, suggestions: products.slice(0, 3) }),
  'status-cancelled':        mail.buildOrderStatusUpdateEmail({ firstName: 'Layla', orderId: 10482, newStatus: 'Cancelled', cancellationReason: 'Requested by customer', items }),
  'status-payment-failed':   mail.buildOrderStatusUpdateEmail({ firstName: 'Layla', orderId: 10485, newStatus: 'Payment Failed', cancellationReason: 'Your payment could not be processed. Please try again or use a different payment method.' }),
  'abandoned-cart':          mail.buildAbandonedCartEmail('Layla', items, products.slice(0, 3)),
  'marketing':               mail.buildMarketingEmail('New in: the GERnétic summer edit', '<h2 style="margin:0 0 12px;color:#111114;">The summer edit is here</h2><p>Lightweight textures and daily SPF, chosen by our skincare team for UAE heat.</p>'),
  'stock-clearance':         mail.buildStockClearanceEmail({ firstName: 'Layla', code: 'LASTPIECES', discountPercent: 30, expiresAt: new Date(Date.now() + 7 * 864e5), heroImage: IMG, products }),
  'admin-new-order':         mail.buildAdminNotificationEmail(10482, 'layla@example.com', 891, address, { customerName: 'Layla Haddad', customerPhone: '+971501234567', paymentMethod: 'cashOnDelivery', items, subtotal: 990, shippingCost: 0, taxAmount: 42.43, discountAmount: 99, couponCode: 'WELCOME10', placedAt }),
  'admin-chat':              mail.buildChatNotificationEmail('Layla Haddad', 'layla@example.com', 77, 'Hi! Is the Hydra serum suitable for sensitive skin?\nThank you <3'),
  'admin-payout':            mail.buildPayoutRequestEmail(12450.5, 'aed', 'po_1PqR2sT3uV4wX5yZ'),
  'admin-transaction':       mail.buildTransactionEmail({ id: 'txn_3PqR2sT3uV4wX5yZ', amount: 89100, fee: 2614, net: 86486, currency: 'aed', status: 'available', type: 'charge', created: Math.floor(Date.now() / 1000), source: { payment_method_details: { card: { brand: 'visa', last4: '4242', exp_month: 8, exp_year: 2029, country: 'AE' } }, billing_details: { name: 'Layla Haddad', email: 'layla@example.com' } } }),
  'invoice':                 { subject: 'Invoice (attachment / page)', html: mail.generateInvoiceHtml({ ...orderDetails, status: 'Delivered' }) },
  'invoice-cod-unpaid':      { subject: 'Invoice, COD before delivery', html: mail.generateInvoiceHtml({ ...orderDetails, paymentMethod: 'cashOnDelivery', status: 'Processing' }) },
};

const links = [];
for (const [name, { subject, html }] of Object.entries(emails)) {
  writeFileSync(join(outDir, `${name}.html`), html);
  links.push(`<li><a href="${name}.html" target="frame">${name}</a><br><small>${subject.replace(/</g, '&lt;')}</small></li>`);
  console.log(`${name.padEnd(26)} ${subject}`);
}

writeFileSync(join(outDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Email previews</title>
<style>body{margin:0;display:flex;height:100vh;font-family:system-ui,sans-serif}nav{width:300px;overflow:auto;border-right:1px solid #eee;padding:16px}li{margin:0 0 10px}small{color:#888}iframe{flex:1;border:0}</style>
<nav><h3>Emails</h3><ol>${links.join('')}</ol></nav><iframe name="frame" src="${Object.keys(emails)[0]}.html"></iframe>`);
console.log(`\nWrote ${links.length} previews to ${outDir}${process.platform === 'win32' ? '\\' : '/'}index.html`);
process.exit(0);
