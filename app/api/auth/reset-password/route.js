import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
    }

    const client = await db.connect();
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atomic: only updates if the hash prefix still matches (token not yet used)
      const result = await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 AND email = $3 AND password_hash LIKE $4 RETURNING id',
        [hashedPassword, payload.userId, payload.email, payload.pwdHash + '%']
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
      }

      return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
