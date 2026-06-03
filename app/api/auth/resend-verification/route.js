import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { SignJWT } from 'jose';
import { sendEmailVerificationEmail } from '@/lib/mail';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { rows } = await db.query(
      'SELECT id, first_name, email, email_verified FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1',
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent email enumeration
    if (rows.length === 0 || rows[0].email_verified === true) {
      return NextResponse.json({ message: 'If your account needs verification, a new email has been sent.' });
    }

    const user = rows[0];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id, email: user.email, purpose: 'email_verification' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';
    const verifyUrl = `${base}/api/auth/verify-email?token=${token}`;
    await sendEmailVerificationEmail(user.email, user.first_name, verifyUrl);

    return NextResponse.json({ message: 'Verification email sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
