
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { amount, currency } = await req.json();

    const allowedPaymentMethodTypes = ['card', 'apple_pay', 'link'];
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: [...allowedPaymentMethodTypes], // Ensure it's a new array
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Error creating payment intent' }, { status: 500 });
  }
}
