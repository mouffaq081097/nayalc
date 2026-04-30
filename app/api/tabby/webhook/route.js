import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Tabby sends webhook events when payment status changes.
// Supported events: payment.authorized, payment.closed, payment.rejected, payment.expired
export async function POST(req) {
  try {
    const payload = await req.json();
    const { id: paymentId, status, reference_id: referenceId } = payload;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Update order payment_confirmed when Tabby authorizes or closes payment
    if (status === 'authorized' || status === 'closed') {
      await db.query(
        "UPDATE orders SET payment_confirmed = true WHERE tabby_payment_id = $1",
        [paymentId]
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Tabby webhook error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
