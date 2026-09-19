/**
 * Generates APPLE_CLIENT_SECRET for Sign in with Apple.
 *
 * Apple does not hand you a client secret. It is an ES256 JWT that you sign
 * yourself with the .p8 private key downloaded from the Apple Developer
 * portal, and Apple caps its lifetime at 6 months — so this must be re-run
 * before it expires or Apple sign-in silently starts failing.
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --team-id=ABCDE12345 \
 *     --key-id=XYZ9876543 \
 *     --client-id=com.nayalc.web \
 *     --key=./AuthKey_XYZ9876543.p8
 *
 * Where:
 *   --team-id    Apple Developer Team ID (Membership page, top right)
 *   --key-id     Key ID of the "Sign in with Apple" key you created
 *   --client-id  Your Services ID (NOT the App ID) — this is APPLE_CLIENT_ID
 *   --key        Path to the AuthKey_XXXXXXXX.p8 file (downloadable once)
 */

import { readFileSync } from 'node:fs';
import { SignJWT, importPKCS8 } from 'jose';

// Apple rejects anything longer than 6 months; stay just inside it.
const MAX_LIFETIME_SECONDS = 86400 * 180;

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

function fail(message) {
  console.error(`\nError: ${message}\n`);
  console.error('Usage:');
  console.error('  node scripts/generate-apple-secret.mjs \\');
  console.error('    --team-id=ABCDE12345 \\');
  console.error('    --key-id=XYZ9876543 \\');
  console.error('    --client-id=com.nayalc.web \\');
  console.error('    --key=./AuthKey_XYZ9876543.p8\n');
  process.exit(1);
}

const args = parseArgs(process.argv);
const teamId = args['team-id'];
const keyId = args['key-id'];
const clientId = args['client-id'];
const keyPath = args['key'];

if (!teamId) fail('--team-id is required (Apple Developer Team ID).');
if (!keyId) fail('--key-id is required (Key ID of your Sign in with Apple key).');
if (!clientId) fail('--client-id is required (your Services ID, e.g. com.nayalc.web).');
if (!keyPath) fail('--key is required (path to the AuthKey_XXXXXXXX.p8 file).');

let pem;
try {
  pem = readFileSync(keyPath, 'utf8');
} catch {
  fail(`Could not read the private key at "${keyPath}".`);
}

if (!pem.includes('BEGIN PRIVATE KEY')) {
  fail(`"${keyPath}" does not look like a .p8 private key (no "BEGIN PRIVATE KEY" header).`);
}

// A Services ID is a reverse-DNS identifier. An App ID here is the single most
// common mistake and produces an opaque invalid_client from Apple.
if (!clientId.includes('.')) {
  fail(`--client-id "${clientId}" does not look like a Services ID (expected reverse-DNS, e.g. com.nayalc.web).`);
}

const now = Math.floor(Date.now() / 1000);
const expiresAt = now + MAX_LIFETIME_SECONDS;

const privateKey = await importPKCS8(pem, 'ES256');

const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: keyId })
  .setIssuer(teamId)          // iss = Team ID
  .setSubject(clientId)       // sub = Services ID
  .setAudience('https://appleid.apple.com')
  .setIssuedAt(now)
  .setExpirationTime(expiresAt)
  .sign(privateKey);

const expiryDate = new Date(expiresAt * 1000).toUTCString();

console.log('\nAdd these to .env.local (and to Vercel for production):\n');
console.log(`APPLE_CLIENT_ID=${clientId}`);
console.log(`APPLE_CLIENT_SECRET=${token}`);
console.log('NEXT_PUBLIC_APPLE_AUTH_ENABLED=true');
console.log(`\nThis secret expires ${expiryDate}.`);
console.log('Apple caps client secrets at 6 months — re-run this script before then,');
console.log('or Apple sign-in will start failing with no change on your side.\n');
