import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import db from '@/lib/db';
import { listTabbyPayments, isTabbyPaid } from '@/lib/tabby';
import { ensureTabbyPaymentColumns, findUnlinkedTabbyOrders } from '@/lib/tabbyOrders';

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

    // Which payments became an order (orders move between these tables as they're fulfilled or cancelled)
    const ids = payments.map(p => p.id);
    await ensureTabbyPaymentColumns();
    const { rows } = ids.length ? await db.query(`
      SELECT tabby_payment_id, id FROM orders WHERE tabby_payment_id = ANY($1)
      UNION ALL SELECT tabby_payment_id, id FROM delivered_orders WHERE tabby_payment_id = ANY($1)
      UNION ALL SELECT tabby_payment_id, id FROM cancelled_orders WHERE tabby_payment_id = ANY($1)
    `, [ids]) : { rows: [] };
    const orderByPayment = new Map(rows.map(r => [r.tabby_payment_id, r.id]));
    for (const p of payments) {
      p.order_id = orderByPayment.get(p.id) ?? null;
      p.paid = isTabbyPaid(p.status);
    }

    // A paid payment with no linked order may still have one that was created by hand without its payment ID
    const unlinked = await findUnlinkedTabbyOrders(payments.filter(p => p.paid && !p.order_id).map(p => p.buyer?.email));
    for (const p of payments) {
      if (p.paid && !p.order_id) {
        p.possible_order_id = unlinked.find(o => o.email === p.buyer?.email?.toLowerCase())?.id ?? null;
      }
    }
    return NextResponse.json({ payments, settlements_available: false });
  } catch (error) {
    console.error('Error fetching Tabby payments:', error);
    return NextResponse.json({ message: `Tabby could not be reached: ${error.message}` }, { status: 502 });
  }
}
