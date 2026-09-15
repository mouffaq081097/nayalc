// Renders the stock clearance campaign email to an HTML file for design review.
// Reads in-stock products from the database (read-only). No coupon is created and nothing is sent.
// Usage: node scripts/preview-stock-clearance-email.mjs [outputPath]
import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: '.env.local' });

// Imported after dotenv so NEXT_PUBLIC_BASE_URL and POSTGRES_URL are set
const { buildStockClearanceEmail } = await import('../lib/mail.js');
const { fetchClearanceProducts, CLEARANCE_DEFAULTS } = await import('../lib/stockClearance.js');

let products = [];
try {
  products = await fetchClearanceProducts();
} catch (error) {
  console.warn('Could not load products from the database:', error.message);
}

const { subject, html } = buildStockClearanceEmail({
  firstName: 'Layla',
  code: CLEARANCE_DEFAULTS.code,
  discountPercent: CLEARANCE_DEFAULTS.discountPercent,
  expiresAt: new Date(Date.now() + CLEARANCE_DEFAULTS.validDays * 24 * 60 * 60 * 1000),
  heroImage: CLEARANCE_DEFAULTS.heroImage,
  products,
});

const outputPath = resolve(process.argv[2] || 'email-preview-stock-clearance.html');
writeFileSync(outputPath, html);
console.log(`Subject:  ${subject}`);
console.log(`Products: ${products.map(p => `${p.name} (${p.stock_quantity} in stock)`).join(', ') || 'none'}`);
console.log(`Wrote ${outputPath}`);
process.exit(0);
