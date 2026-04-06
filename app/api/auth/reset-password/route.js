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

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    let payload;
    try {
        const { payload: verifiedPayload } = await jwtVerify(token, secret);
        payload = verifiedPayload;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
    }

    const client = await db.connect();
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in DB
      const result = await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 AND email = $3 RETURNING id',
        [hashedPassword, payload.userId, payload.email]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
