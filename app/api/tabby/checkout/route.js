import { NextResponse } from 'next/server';
import { createTabbyCheckout } from '@/lib/tabby';
import { currentSessionUser } from '@/lib/adminAuth';
import { savePendingTabbyOrder } from '@/lib/tabbyOrders';

export async function POST(req) {
  const sessionUser = await currentSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Please sign in to pay with Tabby.' }, { status: 401 });
  }

  try {
    const {
      amount, items, buyer, shippingAddress,
      taxAmount, shippingAmount, discountAmount, referenceId,
      orderData,
    } = await req.json();

    if (!amount || !items?.length || !buyer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!orderData?.user_address_id || !Array.isArray(orderData.items) || orderData.items.length === 0) {
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
      userId: sessionUser.id,
      orderData: { ...orderData, user_id: sessionUser.id },
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
