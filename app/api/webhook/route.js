import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import db from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/mail';

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
        
        if (result.rowCount === 0) {
            // Optional: Store this event to process later if the order creation is lagging
        }
        break;
        
      case 'payment_intent.payment_failed':
        const paymentFailed = event.data.object;
        try {
            const failedOrderResult = await db.query(
                `UPDATE orders SET order_status = 'Payment Failed', updated_at = NOW()
                 WHERE stripe_payment_intent_id = $1
                 RETURNING id, user_id`,
                [paymentFailed.id]
            );
            if (failedOrderResult.rowCount > 0) {
                const failedOrder = failedOrderResult.rows[0];
                const userResult = await db.query(
                    'SELECT email, first_name FROM users WHERE id = $1',
                    [failedOrder.user_id]
                );
                if (userResult.rows.length > 0) {
                    const { email, first_name } = userResult.rows[0];
                    await sendOrderStatusUpdateEmail(
                        email, first_name, failedOrder.id,
                        'Payment Failed',
                        'Your payment could not be processed. Please try again or use a different payment method.',
                        null, null, null, null, null, [], null, null, null, null, null
                    );
                }
            }
        } catch (err) {
            console.error('Error handling payment_failed webhook:', err);
        }
        break;
        
      default:
        // Unexpected event type
        break;
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
