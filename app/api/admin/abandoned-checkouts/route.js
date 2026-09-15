import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABANDONED_AFTER_MINUTES, listAbandonedCheckouts, listSavedCarts } from '@/lib/checkoutSessions';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestedDays = parseInt(new URL(request.url).searchParams.get('days'), 10);
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 365) : 30;

    const [checkouts, savedCarts] = await Promise.all([listAbandonedCheckouts({ days }), listSavedCarts()]);
    return NextResponse.json({ checkouts, savedCarts, days, abandonedAfterMinutes: ABANDONED_AFTER_MINUTES });
  } catch (error) {
    console.error('Abandoned checkouts error:', error);
    return NextResponse.json({ message: 'Failed to load abandoned checkouts', error: error.message }, { status: 500 });
  }
}
