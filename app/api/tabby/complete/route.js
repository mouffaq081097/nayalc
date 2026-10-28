import { NextResponse } from 'next/server';
import { completeTabbyOrder, getPendingTabbyOrder } from '@/lib/tabbyOrders';
import { createOrderLinkToken } from '@/lib/guestCheckout';

// Called by /tabby-return when Tabby sends the customer back. Creates the order from the checkout
// saved on the server, so it works even when the customer returns in a different browser or isn't
// signed in there. The payment is verified with Tabby before anything is created.
export async function POST(req) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ message: 'paymentId is required' }, { status: 400 });
    }
    const { status, body } = await completeTabbyOrder(paymentId);
    if (!body.orderId) return NextResponse.json({ message: body.message }, { status });

    // Only say which order it is — this endpoint doesn't need a signed-in customer. A guest
    // checkout also gets the signed link that opens its confirmation page.
    const pending = await getPendingTabbyOrder(paymentId).catch(() => null);
    const access = pending?.order_data?.guest ? createOrderLinkToken({ orderId: body.orderId, userId: pending.user_id }) : undefined;
    return NextResponse.json({ message: body.message, orderId: body.orderId, ...(access && { access }) }, { status });
  } catch (error) {
    console.error('Tabby complete error:', error);
    return NextResponse.json({ message: 'Your order could not be created. Please contact us — your payment is safe.' }, { status: 500 });
  }
}
