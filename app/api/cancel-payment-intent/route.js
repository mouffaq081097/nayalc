import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { paymentIntentId } = await request.json();
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ message: 'Invalid payment intent ID.' }, { status: 400 });
    }
    // Cancellation is best-effort — ignore errors if PI is already succeeded/cancelled
    await stripe.paymentIntents.cancel(paymentIntentId).catch(() => {});
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to cancel payment intent.' }, { status: 500 });
  }
}
