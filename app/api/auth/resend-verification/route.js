import { NextResponse, after } from 'next/server';
import db from '@/lib/db';
import { SignJWT } from 'jose';
import { sendEmailVerificationEmail } from '@/lib/mail';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const GENERIC = 'If your account needs verification, a new email has been sent.';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Limit by IP and by target address — one stops a single host blasting many
    // addresses, the other stops many hosts mailbombing one person.
    const byIp = rateLimit(`resend:ip:${clientIp(request)}`, { limit: 5, windowMs: 15 * 60_000 });
    const byEmail = rateLimit(`resend:email:${normalized}`, { limit: 3, windowMs: 15 * 60_000 });
    if (!byIp.ok || !byEmail.ok) {
      const retryAfter = Math.max(byIp.retryAfter, byEmail.retryAfter);
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { rows } = await db.query(
      'SELECT id, first_name, email, email_verified FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1',
      [normalized]
    );

    // Always return success to prevent email enumeration
    if (rows.length === 0 || rows[0].email_verified === true) {
      return NextResponse.json({ message: GENERIC });
    }

    const user = rows[0];

    after(async () => {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({
          userId: user.id,
          email: user.email,
          purpose: 'email_verification',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(secret);

        const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';
        await sendEmailVerificationEmail(
          user.email,
          user.first_name,
          `${base}/api/auth/verify-email?token=${token}`
        );
      } catch (e) {
        console.error('Resend verification email failed for user', user.id, e);
      }
    });

    return NextResponse.json({ message: 'Verification email sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
