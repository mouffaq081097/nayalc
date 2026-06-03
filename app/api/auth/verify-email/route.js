import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { jwtVerify } from 'jose';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';

  if (!token) {
    return NextResponse.redirect(`${base}/auth/verify-email?error=missing_token`);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.purpose !== 'email_verification') {
      return NextResponse.redirect(`${base}/auth/verify-email?error=invalid_token`);
    }

    const { userId, email } = payload;

    const { rows } = await db.query(
      'UPDATE users SET email_verified = true WHERE id = $1 AND LOWER(email) = LOWER($2) RETURNING id, email_verified',
      [userId, email]
    );

    if (rows.length === 0) {
      return NextResponse.redirect(`${base}/auth/verify-email?error=user_not_found`);
    }

    return NextResponse.redirect(`${base}/auth/verify-email?success=1`);
  } catch (err) {
    console.error('Email verification error:', err);
    const isExpired = err.code === 'ERR_JWT_EXPIRED';
    return NextResponse.redirect(
      `${base}/auth/verify-email?error=${isExpired ? 'expired' : 'invalid_token'}`
    );
  }
}
