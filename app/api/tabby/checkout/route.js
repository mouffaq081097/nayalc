import { NextResponse } from 'next/server';
import { createTabbyCheckout } from '@/lib/tabby';

export async function POST(req) {
  try {
    const {
      amount, items, buyer, shippingAddress,
      taxAmount, shippingAmount, discountAmount, referenceId,
    } = await req.json();

    if (!amount || !items?.length || !buyer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json({
      sessionId: session.id,
      paymentId: session.payment?.id,
      webUrl,
    });
  } catch (error) {
    console.error('Tabby checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
