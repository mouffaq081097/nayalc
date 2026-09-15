import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listTabbyPayments } from '@/lib/tabby';

const sum = (entries) => (entries || []).reduce((total, entry) => total + (parseFloat(entry.amount) || 0), 0);

// Recent Tabby payments. Tabby's API has no balance or settlement data (those endpoints return 404),
// so the page shows payments only and points to the Tabby merchant dashboard for payouts.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const data = await listTabbyPayments(50);
    const payments = (data.payments || []).map(p => ({
      id: p.id,
      status: p.status,
      amount: parseFloat(p.amount) || 0,
      currency: p.currency,
      created_at: p.created_at,
      is_test: Boolean(p.is_test),
      reference_id: p.order?.reference_id || null,
      buyer: p.buyer ? { name: p.buyer.name, email: p.buyer.email } : null,
      captured: sum(p.captures),
      refunded: sum(p.refunds),
    }));
    return NextResponse.json({ payments, settlements_available: false });
  } catch (error) {
    console.error('Error fetching Tabby payments:', error);
    return NextResponse.json({ message: `Tabby could not be reached: ${error.message}` }, { status: 502 });
  }
}
