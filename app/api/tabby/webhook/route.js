import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import { sendOrderStatusUpdateEmail } from '@/lib/mail';
import { completeTabbyOrder } from '@/lib/tabbyOrders';
import { tabbyStatus } from '@/lib/tabby';

// Tabby sends webhook events when payment status changes.
// Supported events: payment.authorized, payment.closed, payment.rejected, payment.expired
export async function POST(req) {
  try {
    const rawBody = await req.text();

    // Verify Tabby webhook signature (C7)
    const webhookSecret = process.env.TABBY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-tabby-signature') || req.headers.get('x-webhook-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { id: paymentId, reference_id: referenceId } = payload;
    const status = tabbyStatus(payload.status);

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (status === 'authorized' || status === 'closed') {
      // If the customer never made it back to the site, create their order now
      try {
        await completeTabbyOrder(paymentId);
      } catch (err) {
        console.error(`Tabby webhook: could not create the order for payment ${paymentId}:`, err);
      }
      // Mirror Stripe webhook: confirm payment and move order to Processing
      await db.query(
        `UPDATE orders
         SET payment_confirmed = true, order_status = 'Processing', updated_at = NOW()
         WHERE tabby_payment_id = $1`,
        [paymentId]
      );
    } else if (status === 'rejected' || status === 'expired') {
      // Mirror Stripe payment_intent.payment_failed: mark order and email customer
      try {
        const failResult = await db.query(
          `UPDATE orders
           SET order_status = 'Payment Failed', updated_at = NOW()
           WHERE tabby_payment_id = $1
           RETURNING id, user_id`,
          [paymentId]
        );
        if (failResult.rowCount > 0) {
          const { id: orderId, user_id } = failResult.rows[0];
          const userResult = await db.query(
            'SELECT email, first_name FROM users WHERE id = $1',
            [user_id]
          );
          if (userResult.rows.length > 0) {
            const { email, first_name } = userResult.rows[0];
            const reason = status === 'rejected'
              ? 'Your Tabby payment was declined. Please try again or choose a different payment method.'
              : 'Your Tabby payment session expired. Please restart checkout and try again.';
            await sendOrderStatusUpdateEmail(
              email, first_name, orderId,
              'Payment Failed',
              reason,
              null, null, null, null, null, [], null, null, null, null, null
            );
          }
        }
      } catch (err) {
        console.error('Error handling Tabby payment failure webhook:', err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Tabby webhook error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
