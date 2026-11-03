import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { CartReminderError, sendCartReminder } from '@/lib/cartReminders';

// POST /api/admin/abandoned-checkouts/remind { userId, sessionId?, couponCode? }
// Emails the customer their bag ("Still thinking it over?"), optionally with a discount code.
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => ({}));
  if (!Number.isInteger(Number(body.userId))) return NextResponse.json({ message: 'Missing customer.' }, { status: 400 });
  try {
    const result = await sendCartReminder({
      userId: Number(body.userId),
      sessionId: body.sessionId ? Number(body.sessionId) : null,
      couponCode: body.couponCode || null,
      manual: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CartReminderError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error('Cart reminder failed:', error);
    return NextResponse.json({ message: 'The reminder could not be sent.', error: error.message }, { status: 500 });
  }
}
