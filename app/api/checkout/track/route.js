import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordCheckoutActivity } from '@/lib/checkoutSessions';

const STEPS = new Set(['address', 'payment']);

// Called by the checkout page as the customer moves through it, so abandoned checkouts show up in the admin portal.
// The customer always comes from the session, never from the request body.
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const userId = parseInt(session?.user?.id, 10);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : [])
      .map(i => ({ productId: parseInt(i.productId, 10), quantity: parseInt(i.quantity, 10) }))
      .filter(i => i.productId > 0 && i.quantity > 0)
      .slice(0, 100);
    if (items.length === 0) return NextResponse.json({ ok: true });

    const total = Number(body.total);
    await recordCheckoutActivity({
      userId,
      step: STEPS.has(body.step) ? body.step : 'address',
      paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod.slice(0, 40) : null,
      addressId: parseInt(body.addressId, 10) || null,
      items,
      total: Number.isFinite(total) && total >= 0 && total < 10_000_000 ? Math.round(total * 100) / 100 : null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Checkout tracking error:', error);
    return NextResponse.json({ message: 'Failed to record checkout' }, { status: 500 });
  }
}
