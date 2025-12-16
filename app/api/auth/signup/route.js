
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName } = await request.json();

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in DB
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, first_name, last_name',
        [username, email, hashedPassword, firstName, lastName]
      );
      const newUser = result.rows[0];

      // Create a Stripe customer
      const customer = await stripe.customers.create({
        email: newUser.email,
        name: `${newUser.first_name} ${newUser.last_name}`,
        metadata: {
          userId: newUser.id,
        },
      });

      // Update user with Stripe customer ID
      await client.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, newUser.id]
      );
      
      newUser.stripe_customer_id = customer.id;

      return NextResponse.json({ user: newUser }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for unique constraint violation
    if (error.code === '23505') {
        return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
