import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      // Check if user exists
      const result = await client.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      
      if (result.rows.length === 0) {
        // For security, don't reveal if email exists or not
        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      const user = result.rows[0];

      // Create reset token (valid for 1 hour)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
      const resetToken = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);

      // Send email
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
