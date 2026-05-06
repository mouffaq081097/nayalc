import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET  /api/admin/recover-order?pi=pi_xxx  → Stripe PI lookup
// GET  /api/admin/recover-order?email=x@y.com → user info + cart + addresses
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pi = searchParams.get('pi');
    const email = searchParams.get('email');

    // --- User cart lookup by email ---
    if (email) {
        const userRes = await db.query(
            'SELECT id, first_name, email FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );
        if (userRes.rows.length === 0) {
            return NextResponse.json({ message: 'No user found with that email.' }, { status: 404 });
        }
        const user = userRes.rows[0];

        const [cartRes, addressRes] = await Promise.all([
            db.query(
                `SELECT p.id as "productId", uc.quantity, p.name, p.price,
                        (SELECT pi2.image_url FROM product_images pi2 WHERE pi2.product_id = p.id AND pi2.is_main = TRUE LIMIT 1) as "imageUrl"
                 FROM user_carts uc JOIN products p ON uc.product_id = p.id
                 WHERE uc.user_id = $1`,
                [user.id]
            ),
            db.query(
                'SELECT id, shipping_address, city, country, address_label, is_default FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC',
                [user.id]
            ),
        ]);

        return NextResponse.json({
            user: { id: user.id, firstName: user.first_name, email: user.email },
            cart: cartRes.rows,
            addresses: addressRes.rows,
        });
    }

    // --- Stripe PI lookup ---
    if (!pi) return NextResponse.json({ message: 'Missing pi or email param' }, { status: 400 });

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
// Body: { pi?, payment_method, user_id, user_address_id, items: [{ productId, quantity, price }] }
// Creates the missing order and sends the confirmation email.
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { pi, payment_method = 'card', user_id, user_address_id, items } = await request.json();

    if (!user_id || !user_address_id || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields: user_id, user_address_id, items' }, { status: 400 });
    }

    let totalAmount;
    let stripePaymentIntentId = null;

    if (payment_method === 'card') {
        if (!pi) return NextResponse.json({ message: 'Card recovery requires a pi (payment intent ID).' }, { status: 400 });

        const piData = await stripe.paymentIntents.retrieve(pi);
        if (piData.status !== 'succeeded') {
            return NextResponse.json({ message: `Payment intent status is "${piData.status}", not succeeded.` }, { status: 400 });
        }

        const duplicate = await db.query('SELECT id FROM orders WHERE stripe_payment_intent_id = $1', [pi]);
        if (duplicate.rows.length > 0) {
            return NextResponse.json({ message: `Order already exists for this payment: order #${duplicate.rows[0].id}` }, { status: 409 });
        }

        totalAmount = piData.amount / 100;
        stripePaymentIntentId = pi;
    } else {
        // For cash-on-delivery / tabby — total derived from items
        totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity)), 0);
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `INSERT INTO orders
                (user_address_id, payment_method, total_amount, tax_amount, subtotal,
                 shipping_cost, gift_wrap, gift_wrap_cost, discount_amount,
                 order_status, payment_confirmed, user_id, stripe_payment_intent_id,
                 shipping_scheduled_date, redeemed_points)
             VALUES ($1, $2, $3, 0, $3, 0, false, 0, 0,
                     'Confirmed', $4, $5, $6,
                     NOW() + INTERVAL '7 days', 0)
             RETURNING id`,
            [user_address_id, payment_method, totalAmount, payment_method === 'card', user_id, stripePaymentIntentId]
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

        // Clear the user's cart now that the order is created
        await client.query('DELETE FROM user_carts WHERE user_id = $1', [user_id]);

        await client.query('COMMIT');

        // Send confirmation email
        try {
            const [userRes, addressRes] = await Promise.all([
                db.query('SELECT email, first_name FROM users WHERE id = $1', [user_id]),
                db.query('SELECT shipping_address, city, zip_code, country FROM user_addresses WHERE id = $1', [user_address_id]),
            ]);
            const userEmail = userRes.rows[0]?.email;
            const firstName = userRes.rows[0]?.first_name || 'Customer';
            const addr = addressRes.rows[0];
            const shippingAddress = addr
                ? { street: addr.shipping_address || '', city: addr.city || '', zip: addr.zip_code || '', country: addr.country || 'UAE', state: '' }
                : { street: '', city: '', zip: '', country: 'UAE', state: '' };

            const productIds = items.map(i => i.productId);
            const { rows: products } = await db.query(
                'SELECT p.id, p.name, pi2.image_url FROM products p LEFT JOIN product_images pi2 ON p.id = pi2.product_id AND pi2.is_main = TRUE WHERE p.id = ANY($1)',
                [productIds]
            );
            const itemsWithDetails = items.map(item => {
                const p = products.find(pr => pr.id === item.productId);
                return { ...item, name: p?.name || 'Product', imageUrl: p?.image_url || '' };
            });

            if (userEmail) {
                await sendOrderConfirmationEmail(userEmail, firstName, orderId, totalAmount, 0, 0, totalAmount, 0, itemsWithDetails, shippingAddress, 0, null);
            }
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendAdminNotificationEmail(adminEmail, orderId, userEmail || 'Unknown', totalAmount, shippingAddress);
            }
        } catch (emailErr) {
            console.error('Recovery email failed (order still created):', emailErr);
        }

        return NextResponse.json({ message: 'Order recovered successfully', orderId }, { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Recovery failed', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
