import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    const charges = await stripe.charges.list({
      payment_intent: id,
    });

    const amount_captured = charges.data.reduce((acc, charge) => acc + charge.amount_captured, 0);
    const amount_received = charges.data.reduce((acc, charge) => acc + charge.amount, 0);


    // Return a subset of data to avoid exposing too much
    const response = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        amount_captured: amount_captured,
        amount_received: amount_received,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        charges: charges.data.map(charge => ({
            id: charge.id,
            amount: charge.amount,
            amount_captured: charge.amount_captured,
            status: charge.status,
            receipt_url: charge.receipt_url,
            billing_details: charge.billing_details,
        })),
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
