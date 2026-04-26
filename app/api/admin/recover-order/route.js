import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import db from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET  /api/admin/recover-order?pi=pi_xxx
// Returns Stripe PI details + whether an order already exists for it.
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pi = searchParams.get('pi');
    if (!pi) return NextResponse.json({ message: 'Missing pi param' }, { status: 400 });

    const [piData, existingOrder] = await Promise.all([
        stripe.paymentIntents.retrieve(pi),
        db.query('SELECT id, order_status, created_at FROM orders WHERE stripe_payment_intent_id = $1', [pi]),
    ]);

    return NextResponse.json({
        stripe: {
            id: piData.id,
            status: piData.status,
            amount: piData.amount,
            currency: piData.currency,
            amountFormatted: `${piData.currency.toUpperCase()} ${(piData.amount / 100).toFixed(2)}`,
            created: new Date(piData.created * 1000).toISOString(),
            paymentMethod: piData.payment_method,
        },
        existingOrder: existingOrder.rows[0] || null,
    });
}

// POST /api/admin/recover-order
// Body: { pi, user_id, user_address_id, items: [{ productId, quantity, price }] }
// Creates the missing order linked to the already-paid PI.
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { pi, user_id, user_address_id, items } = await request.json();

    if (!pi || !user_id || !user_address_id || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields: pi, user_id, user_address_id, items' }, { status: 400 });
    }

    // Verify PI succeeded in Stripe
    const piData = await stripe.paymentIntents.retrieve(pi);
    if (piData.status !== 'succeeded') {
        return NextResponse.json({ message: `Payment intent status is "${piData.status}", not succeeded.` }, { status: 400 });
    }

    // Make sure we haven't already created an order for this PI
    const duplicate = await db.query('SELECT id FROM orders WHERE stripe_payment_intent_id = $1', [pi]);
    if (duplicate.rows.length > 0) {
        return NextResponse.json({ message: `Order already exists for this payment: order #${duplicate.rows[0].id}` }, { status: 409 });
    }

    const totalAmount = piData.amount / 100;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `INSERT INTO orders
                (user_address_id, payment_method, total_amount, tax_amount, subtotal,
                 shipping_cost, gift_wrap, gift_wrap_cost, discount_amount,
                 order_status, payment_confirmed, user_id, stripe_payment_intent_id,
                 shipping_scheduled_date, redeemed_points)
             VALUES ($1, 'card', $2, 0, $2, 0, false, 0, 0,
                     'Confirmed', true, $3, $4,
                     NOW() + INTERVAL '7 days', 0)
             RETURNING id`,
            [user_address_id, totalAmount, user_id, pi]
        );
        const orderId = rows[0].id;

        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.productId, item.quantity, item.price]
            );
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.productId]
            );
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Order recovered successfully', orderId }, { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Recovery failed', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
