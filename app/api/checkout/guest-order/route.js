import { NextResponse } from 'next/server';
import { placeOrder } from '@/lib/placeOrder';
import { readCheckoutToken, createOrderLinkToken } from '@/lib/guestCheckout';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Checkout without signing in, step 2: places the order for the account and
// address named by the checkout token. Everything else is checked by
// placeOrder() exactly as for a signed-in customer (stock, prices, discount,
// and the card or Tabby payment). Returns a link token for the confirmation page.
export async function POST(request) {
    const limited = rateLimit(`guest-order:ip:${clientIp(request)}`, { limit: 20, windowMs: 10 * 60_000 });
    if (!limited.ok) {
        return NextResponse.json({ message: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
    }
    try {
        const { token, order } = await request.json().catch(() => ({}));
        const guest = readCheckoutToken(token);
        if (!guest) {
            return NextResponse.json({ message: 'Your checkout timed out. Please check your details and try again.' }, { status: 401 });
        }
        if (!order || typeof order !== 'object') {
            return NextResponse.json({ message: 'Missing order details.' }, { status: 400 });
        }
        // Cash on delivery needs a signed-in customer: an unpaid order needs a confirmed email
        if (order.payment_method === 'cashOnDelivery') {
            return NextResponse.json({ message: 'Please sign in to pay cash on delivery, or choose another payment method.' }, { status: 400 });
        }

        const result = await placeOrder({
            ...order,
            user_id: guest.userId,
            user_address_id: guest.addressId,
            redeemed_points: 0, // points need a signed-in account
        });
        if (result.status === 201 || result.status === 409) {
            const access = createOrderLinkToken({ orderId: result.body.orderId, userId: guest.userId });
            return NextResponse.json({ ...result.body, access }, { status: result.status });
        }
        return NextResponse.json(result.body, { status: result.status });
    } catch (error) {
        console.error('Guest order failed:', error);
        return NextResponse.json({ message: 'Your order could not be placed. Please try again.' }, { status: 500 });
    }
}
