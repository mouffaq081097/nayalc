import { NextResponse } from 'next/server';
import { createTabbyCheckout } from '@/lib/tabby';
import { currentSessionUser } from '@/lib/adminAuth';
import { savePendingTabbyOrder } from '@/lib/tabbyOrders';
import { readCheckoutToken } from '@/lib/guestCheckout';

export async function POST(req) {
  try {
    const {
      amount, items, buyer, shippingAddress,
      taxAmount, shippingAmount, discountAmount, referenceId,
      orderData, guestToken,
    } = await req.json();

    // A signed-in customer, or a guest with a checkout token (lib/guestCheckout.js)
    const sessionUser = await currentSessionUser();
    const guest = !sessionUser && guestToken ? readCheckoutToken(guestToken) : null;
    if (!sessionUser && !guest) {
      return NextResponse.json({ error: guestToken ? 'Your checkout timed out. Please check your details and try again.' : 'Please sign in to pay with Tabby.' }, { status: 401 });
    }
    const userId = sessionUser ? sessionUser.id : guest.userId;
    const order = guest
      ? { ...orderData, user_address_id: guest.addressId, redeemed_points: 0, guest: true }
      : orderData;

    if (!amount || !items?.length || !buyer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!order?.user_address_id || !Array.isArray(order.items) || order.items.length === 0) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nayalc.com';

    const session = await createTabbyCheckout({
      amount,
      items,
      buyer,
      shippingAddress,
      taxAmount,
      shippingAmount,
      discountAmount,
      referenceId,
      merchantUrls: {
        success: `${baseUrl}/tabby-return?status=success`,
        cancel: `${baseUrl}/tabby-return?status=cancel`,
        failure: `${baseUrl}/tabby-return?status=failure`,
      },
    });

    // Check if installments product is available for this order
    const available = session.configuration?.available_products?.installments;
    if (!available || available.length === 0) {
      return NextResponse.json(
        { error: 'Tabby is not available for this order. Please choose another payment method.' },
        { status: 422 }
      );
    }

    const webUrl = session.web_url
      || session.configuration?.available_products?.installments?.[0]?.web_url;

    if (!webUrl) {
      return NextResponse.json(
        { error: 'Tabby did not return a checkout URL. Please try again.' },
        { status: 502 }
      );
    }

    const paymentId = session.payment?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Tabby did not return a payment. Please try again.' }, { status: 502 });
    }

    // Saved before the customer leaves, so the order can be created however they come back
    await savePendingTabbyOrder({
      paymentId,
      userId,
      orderData: { ...order, user_id: userId },
      amount: parseFloat(amount),
    });

    return NextResponse.json({
      sessionId: session.id,
      paymentId,
      webUrl,
    });
  } catch (error) {
    console.error('Tabby checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
