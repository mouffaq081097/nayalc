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
      // Re-fetch current password_hash to verify the token hasn't been used already
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE id = $1 AND email = $2',
        [payload.userId, payload.email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
      }

      const currentHash = userResult.rows[0].password_hash;

      // If hash changed since token was issued, the prefix won't match — token is dead
      if (!currentHash || !payload.pwdHash || !currentHash.startsWith(payload.pwdHash)) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

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
