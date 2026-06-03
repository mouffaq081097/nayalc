import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { SignJWT } from 'jose';
import { sendEmailVerificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName } = await request.json();

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      // Ensure email_verified column exists.
      // DEFAULT true so every pre-existing row stays verified; new rows are set to false below.
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true
      `);

      const existingUser = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR username = $2',
        [email, username]
      );
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const normalizedEmail = email.toLowerCase();

      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, email_verified) VALUES ($1, $2, $3, $4, $5, false) RETURNING id, username, email, first_name, last_name',
        [username, normalizedEmail, hashedPassword, firstName, lastName]
      );
      const newUser = result.rows[0];

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: newUser.email,
        name: `${newUser.first_name} ${newUser.last_name}`,
        metadata: { userId: newUser.id },
      });
      await client.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, newUser.id]);
      newUser.stripe_customer_id = customer.id;

      // Welcome loyalty points
      await client.query(
        'INSERT INTO loyalty_transactions (user_id, type, points, description) VALUES ($1, $2, $3, $4)',
        [newUser.id, 'bonus', 500, 'Welcome to Lumière Prestige!']
      );
      await client.query('UPDATE users SET loyalty_points = 500 WHERE id = $1', [newUser.id]);

      // Generate email verification token (24 h)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({
        userId: newUser.id,
        email: newUser.email,
        purpose: 'email_verification',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';
      const verifyUrl = `${base}/api/auth/verify-email?token=${token}`;
      await sendEmailVerificationEmail(newUser.email, newUser.first_name, verifyUrl);

      return NextResponse.json(
        { user: newUser, requiresEmailVerification: true },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
