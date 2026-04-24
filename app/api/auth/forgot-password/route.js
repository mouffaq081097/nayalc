import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || email.length > 254) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      // Return ambiguous message for unknown emails or OAuth-only accounts (no password_hash)
      if (result.rows.length === 0 || !result.rows[0].password_hash) {
        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      const user = result.rows[0];
      const pwdHash = user.password_hash.slice(0, 16);

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET is not set');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }

      const secret = new TextEncoder().encode(jwtSecret);
      const resetToken = await new SignJWT({ userId: user.id, email: user.email, pwdHash })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);

      await sendPasswordResetEmail(user.email, resetToken);

      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
