import { NextResponse, after } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sendEmailVerificationEmail } from '@/lib/mail';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// "Layla Ahmed Al Fahim" -> { first: 'Layla', last: 'Ahmed Al Fahim' }
function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

// Handles are derived server-side and suffixed with the row id, so they are
// unique by construction — a registrant can never be blocked by a handle
// collision they did not choose and cannot see.
function handleSlug(first, last) {
  const slug = `${first}${last}`.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  return slug || 'member';
}

export async function POST(request) {
  try {
    const limited = rateLimit(`signup:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many sign-up attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      );
    }

    const body = await request.json();

    // Accepts the new single `fullName` field, and still accepts
    // firstName/lastName so any older client keeps working.
    const fromFull = splitFullName(body.fullName);
    const firstName = String(body.firstName || fromFull.first || '').trim();
    const lastName = String(body.lastName || fromFull.last || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!firstName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD} characters.` },
        { status: 400 }
      );
    }

    const client = await db.connect();
    try {
      const existing = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Provisional handle keeps the UNIQUE constraint satisfied; rewritten to
      // a readable one below, once we know the id.
      const provisional = `u_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verified, loyalty_points)
         VALUES ($1, $2, $3, $4, $5, false, 0)
         RETURNING id, username, email, first_name, last_name`,
        [provisional, email, hashedPassword, firstName, lastName]
      );
      const newUser = result.rows[0];

      const handle = `${handleSlug(firstName, lastName)}${newUser.id}`;
      try {
        await client.query('UPDATE users SET username = $1 WHERE id = $2', [handle, newUser.id]);
        newUser.username = handle;
      } catch {
        // Astronomically unlikely; the provisional handle is already valid.
      }

      // Everything below this point is off the critical path. The user gets
      // their response — and is signed in by the client — while this runs.
      after(async () => {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          const token = await new SignJWT({
            userId: newUser.id,
            email: newUser.email,
            purpose: 'email_verification',
            callbackUrl: typeof body.callbackUrl === 'string' && body.callbackUrl.startsWith('/')
              ? body.callbackUrl
              : '/',
          })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

          const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';
          await sendEmailVerificationEmail(
            newUser.email,
            newUser.first_name,
            `${base}/api/auth/verify-email?token=${token}`
          );
        } catch (e) {
          console.error('Verification email failed for user', newUser.id, e);
        }
      });

      // Soft verification: the account is usable immediately. `emailVerified`
      // is false until they click the link; the UI nudges them with a banner.
      return NextResponse.json({ user: newUser, emailVerified: false }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
