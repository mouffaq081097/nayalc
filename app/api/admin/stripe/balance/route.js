import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { FINANCE_EMAIL_RECIPIENTS } from '@/lib/financeRecipients';
import { sendPayoutRequestNotificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Order ids for Stripe payment intents, across every order table
async function ordersByPaymentIntent(intentIds) {
  if (intentIds.length === 0) return new Map();
  const { rows } = await db.query(`
    SELECT id, stripe_payment_intent_id FROM orders WHERE stripe_payment_intent_id = ANY($1::text[])
    UNION ALL SELECT id, stripe_payment_intent_id FROM delivered_orders WHERE stripe_payment_intent_id = ANY($1::text[])
    UNION ALL SELECT id, stripe_payment_intent_id FROM cancelled_orders WHERE stripe_payment_intent_id = ANY($1::text[])
  `, [intentIds]);
  return new Map(rows.map(r => [r.stripe_payment_intent_id, r.id]));
}

const intentOf = (source) => {
  const intent = source?.payment_intent;
  return typeof intent === 'string' ? intent : intent?.id || null;
};

// Only what the Payments page shows — not the whole Stripe object
function toTransaction(tx, orderIds) {
  const source = tx.source && typeof tx.source === 'object' ? tx.source : null;
  const card = source?.payment_method_details?.card;
  const intent = intentOf(source);
  return {
    id: tx.id,
    type: tx.type,
    status: tx.status,
    created: tx.created,
    available_on: tx.available_on,
    amount: tx.amount,
    fee: tx.fee,
    net: tx.net,
    currency: tx.currency,
    description: tx.description,
    source: source ? {
      id: source.id,
      object: source.object,
      receipt_url: source.receipt_url || null,
      refunded: Boolean(source.refunded),
      amount_refunded: source.amount_refunded || 0,
      disputed: Boolean(source.disputed),
      card: card ? { brand: card.brand, last4: card.last4, funding: card.funding, country: card.country, exp_month: card.exp_month, exp_year: card.exp_year } : null,
      billing: source.billing_details ? { name: source.billing_details.name, email: source.billing_details.email } : null,
    } : null,
    order_id: intent ? orderIds.get(intent) ?? null : null,
  };
}

const toPayout = (p) => ({
  id: p.id,
  amount: p.amount,
  currency: p.currency,
  status: p.status,
  created: p.created,
  arrival_date: p.arrival_date,
  automatic: p.automatic,
  failure_message: p.failure_message || null,
});

async function listTransactions(startingAfter) {
  const list = await stripe.balanceTransactions.list({ limit: 25, starting_after: startingAfter, expand: ['data.source'] });
  const orderIds = await ordersByPaymentIntent([...new Set(list.data.map(tx => intentOf(tx.source)).filter(Boolean))]);
  return { transactions: list.data.map(tx => toTransaction(tx, orderIds)), has_more: list.has_more };
}

export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const startingAfter = new URL(request.url).searchParams.get('starting_after') || undefined;
  try {
    // "Load more" only needs the next page of transactions
    if (startingAfter) {
      return NextResponse.json(await listTransactions(startingAfter));
    }

    const [balance, transactions, payouts, account] = await Promise.all([
      stripe.balance.retrieve(),
      listTransactions(),
      stripe.payouts.list({ limit: 20 }),
      stripe.accounts.retrieve().catch(() => null),
    ]);

    return NextResponse.json({
      livemode: balance.livemode,
      balance: {
        available: balance.available.map(b => ({ amount: b.amount, currency: b.currency })),
        pending: balance.pending.map(b => ({ amount: b.amount, currency: b.currency })),
      },
      payout_schedule: account?.settings?.payouts?.schedule || null,
      ...transactions,
      payouts: payouts.data.map(toPayout),
    });
  } catch (error) {
    console.error('Error fetching Stripe balance:', error);
    return NextResponse.json({ message: `Stripe could not be reached: ${error.message}` }, { status: 502 });
  }
}

// Pays out the full available balance in one currency
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { currency } = await request.json();
    const code = String(currency || '').toLowerCase();

    // Use the amount Stripe reports as available, never an amount sent by the browser
    const balance = await stripe.balance.retrieve();
    const available = balance.available.find(b => b.currency === code);
    if (!available || available.amount <= 0) {
      return NextResponse.json({ message: 'There is no available balance to pay out in that currency.' }, { status: 400 });
    }

    const payout = await stripe.payouts.create({ amount: available.amount, currency: code });
    const email = await sendPayoutRequestNotificationEmail(FINANCE_EMAIL_RECIPIENTS, available.amount / 100, code, payout.id);

    return NextResponse.json({ message: 'Payout requested', payout: toPayout(payout), emailSent: email.success });
  } catch (error) {
    console.error('Error creating Stripe payout:', error);
    return NextResponse.json({ message: `Stripe didn't accept the payout: ${error.message}` }, { status: 502 });
  }
}
