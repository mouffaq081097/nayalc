import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAdmin } from '@/lib/adminAuth';
import { FINANCE_EMAIL_RECIPIENTS } from '@/lib/financeRecipients';
import { sendPayoutRequestNotificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Re-sends the payout notification, using the payout's details from Stripe
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { payoutId } = await request.json();
    if (!payoutId) {
      return NextResponse.json({ message: 'A payout id is required.' }, { status: 400 });
    }

    const payout = await stripe.payouts.retrieve(payoutId);
    const result = await sendPayoutRequestNotificationEmail(FINANCE_EMAIL_RECIPIENTS, payout.amount / 100, payout.currency, payout.id);
    if (!result.success) {
      return NextResponse.json({ message: 'The email could not be sent.' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Payout email sent' });
  } catch (error) {
    console.error('Error sending payout email:', error);
    return NextResponse.json({ message: `The payout email could not be sent: ${error.message}` }, { status: 500 });
  }
}
