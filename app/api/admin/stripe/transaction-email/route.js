import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAdmin } from '@/lib/adminAuth';
import { FINANCE_EMAIL_RECIPIENTS } from '@/lib/financeRecipients';
import { sendTransactionNotificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Emails a transaction's details, looked up in Stripe by id rather than taken from the browser
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ message: 'A transaction id is required.' }, { status: 400 });
    }

    const transaction = await stripe.balanceTransactions.retrieve(transactionId, { expand: ['source'] });
    const result = await sendTransactionNotificationEmail(FINANCE_EMAIL_RECIPIENTS, transaction);
    if (!result.success) {
      return NextResponse.json({ message: 'The email could not be sent.' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Transaction email sent' });
  } catch (error) {
    console.error('Error sending transaction email:', error);
    return NextResponse.json({ message: `The transaction email could not be sent: ${error.message}` }, { status: 500 });
  }
}
