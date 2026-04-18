import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { userId } = await params;
  try {
    const { rows } = await db.query(
      `SELECT first_name, last_name, email, phone_number FROM users WHERE id = $1`,
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { userId } = await params;
  const { first_name, last_name, phone_number } = await request.json();

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 });
  }

  try {
    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone_number = $3 WHERE id = $4`,
      [first_name.trim(), last_name.trim(), phone_number?.trim() || null, userId]
    );
    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
