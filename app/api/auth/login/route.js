
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendLoginConfirmationEmail } from '@/lib/mail';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      const result = await client.query('SELECT id, username, email, first_name, last_name, password_hash FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const { password_hash, ...userWithoutPassword } = user;
        
        await sendLoginConfirmationEmail(user.email, user.first_name);
        
        return NextResponse.json({ user: userWithoutPassword, token });
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
