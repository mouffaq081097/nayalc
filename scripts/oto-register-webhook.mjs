/**
 * Tells OTO where to send shipment status updates. Run once per environment,
 * after OTO_REFRESH_TOKEN and OTO_WEBHOOK_SECRET are in .env.local:
 *
 *   node scripts/oto-register-webhook.mjs https://nayalc.com
 *
 * OTO then POSTs every order status change to <site>/api/oto/webhook, signed
 * with OTO_WEBHOOK_SECRET, which the route checks before trusting it.
 * Generate the secret with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * and put the same value in the production environment (Vercel) too.
 */
import fs from 'node:fs';

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
}

const site = (process.argv[2] || '').replace(/\/+$/, '');
const { OTO_REFRESH_TOKEN, OTO_WEBHOOK_SECRET } = process.env;
const base = process.env.OTO_API_BASE || 'https://api.tryoto.com/rest/v2';

if (!/^https:\/\//.test(site)) {
  console.error('Usage: node scripts/oto-register-webhook.mjs https://your-site.com');
  process.exit(1);
}
if (!OTO_REFRESH_TOKEN || !OTO_WEBHOOK_SECRET) {
  console.error('OTO_REFRESH_TOKEN and OTO_WEBHOOK_SECRET must both be set in .env.local');
  process.exit(1);
}

const tokenRes = await fetch(`${base}/refreshToken`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token: OTO_REFRESH_TOKEN }),
});
const token = await tokenRes.json().catch(() => ({}));
if (!token.access_token) {
  console.error('OTO sign-in failed:', tokenRes.status, token);
  process.exit(1);
}

const url = `${site}/api/oto/webhook`;
const res = await fetch(`${base}/webhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token.access_token}` },
  body: JSON.stringify({ method: 'POST', url, webhookType: 'orderStatus', secretKey: OTO_WEBHOOK_SECRET }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok || data.success === false) {
  console.error('OTO rejected the webhook:', res.status, data);
  process.exit(1);
}
console.log(`Registered ${url} for OTO order status updates.`, data);
