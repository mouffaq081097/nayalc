import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import db from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        
        // Update order status in database
        // We find the order by the stripe_payment_intent_id
        const updateQuery = `
          UPDATE orders 
          SET payment_confirmed = true, 
              order_status = 'Processing',
              updated_at = NOW()
          WHERE stripe_payment_intent_id = $1
          RETURNING id;
        `;
        
        const result = await db.query(updateQuery, [paymentIntent.id]);
        
        if (result.rowCount > 0) {
            console.log(`Order ${result.rows[0].id} updated to Paid via Webhook.`);
        } else {
            console.log(`No order found for PaymentIntent ${paymentIntent.id}. It might be created shortly.`);
            // Optional: Store this event to process later if the order creation is lagging
        }
        break;
        
      case 'payment_intent.payment_failed':
        const paymentFailed = event.data.object;
        console.log(`Payment failed for ${paymentFailed.id}`);
        break;
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
