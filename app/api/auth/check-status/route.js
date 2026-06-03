import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Called by the login UI after a failed sign-in to determine if the cause
// is an unverified email (so we can show the resend link instead of generic error).
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ needsVerification: false });

    const { rows } = await db.query(
      'SELECT email_verified FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1',
      [email.toLowerCase().trim()]
    );

    // Only return true if the user exists AND is explicitly unverified.
    // Returns false for unknown emails (no enumeration beyond registration 409).
    const needsVerification = rows.length > 0 && rows[0].email_verified === false;
    return NextResponse.json({ needsVerification });
  } catch {
    // If email_verified column doesn't exist yet, treat as not needing verification
    return NextResponse.json({ needsVerification: false });
  }
}
