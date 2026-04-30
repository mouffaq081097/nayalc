import { NextResponse } from 'next/server';
import { getTabbyPayment } from '@/lib/tabby';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
  }

  try {
    const payment = await getTabbyPayment(paymentId);
    return NextResponse.json({
      status: payment.status,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (error) {
    console.error('Tabby verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
