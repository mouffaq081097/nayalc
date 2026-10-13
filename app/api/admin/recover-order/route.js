import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail';
import { getTabbyPayment, isTabbyPaid, tabbyStatus } from '@/lib/tabby';
import { ensureTabbyPendingTable, findOrderForTabbyPayment, findUnlinkedTabbyOrders, getPendingTabbyOrder } from '@/lib/tabbyOrders';
import { calcShipping, getPreorderInfo } from '@/lib/shipping';
import { ensureBackorderColumns } from '@/lib/backorders';
import { vatFromGross } from '@/lib/vat';
import { calcCouponDiscount } from '@/lib/couponDiscount';
import { ensureCouponProductsColumn } from '@/lib/couponRules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sum = (entries) => (entries || []).reduce((total, entry) => total + (parseFloat(entry.amount) || 0), 0);

async function loadCustomer(where, value) {
    const userRes = await db.query(`SELECT id, first_name, email FROM users WHERE ${where} LIMIT 1`, [value]);
    if (userRes.rows.length === 0) return null;
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
    return {
        user: { id: user.id, firstName: user.first_name, email: user.email },
        cart: cartRes.rows,
        addresses: addressRes.rows,
    };
}

// Adds current names and prices to a list of { productId, quantity }
async function describeItems(items) {
    const ids = items.map(i => Number(i.productId)).filter(Number.isInteger);
    if (ids.length === 0) return [];
    const { rows } = await db.query('SELECT id, name, price FROM products WHERE id = ANY($1::int[])', [ids]);
    const byId = new Map(rows.map(p => [p.id, p]));
    return items.map(i => {
        const p = byId.get(Number(i.productId));
        return { productId: Number(i.productId), quantity: Number(i.quantity), price: p ? Number(p.price) : Number(i.price) || 0, name: p?.name || `Product #${i.productId}` };
    });
}

// GET  /api/admin/recover-order?pi=pi_xxx       → Stripe payment lookup
// GET  /api/admin/recover-order?tabby=<id>      → Tabby payment lookup, with the checkout the customer paid for
// GET  /api/admin/recover-order?email=x@y.com   → customer + cart + addresses
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pi = searchParams.get('pi');
    const tabby = searchParams.get('tabby')?.trim();
    const email = searchParams.get('email');

    if (email) {
        const customer = await loadCustomer('LOWER(email) = LOWER($1)', email.trim());
        if (!customer) return NextResponse.json({ message: 'No user found with that email.' }, { status: 404 });
        return NextResponse.json(customer);
    }

    if (tabby) {
        let payment;
        try {
            payment = await getTabbyPayment(tabby);
        } catch (error) {
            return NextResponse.json({ message: `Tabby couldn't find this payment: ${error.message}` }, { status: 404 });
        }
        const [existingOrderId, pending] = await Promise.all([findOrderForTabbyPayment(tabby), getPendingTabbyOrder(tabby)]);

        // The customer: whoever started the saved checkout, otherwise the account with Tabby's buyer email
        const customer = pending
            ? await loadCustomer('id = $1', pending.user_id)
            : payment.buyer?.email ? await loadCustomer('LOWER(email) = LOWER($1)', payment.buyer.email) : null;

        // What they paid for: the saved checkout, otherwise the items Tabby has on the payment
        const paidItems = pending
            ? await describeItems(pending.order_data.items || [])
            : await describeItems((payment.order?.items || []).map(i => ({ productId: i.reference_id, quantity: i.quantity, price: i.unit_price })));

        // Tabby orders this customer has that aren't linked to any payment — maybe this one, created by hand
        const unlinkedOrders = existingOrderId ? [] : await findUnlinkedTabbyOrders([payment.buyer?.email, customer?.user.email]);

        return NextResponse.json({
            tabby: {
                id: payment.id,
                status: tabbyStatus(payment.status),
                paid: isTabbyPaid(payment.status),
                amount: parseFloat(payment.amount) || 0,
                captured: sum(payment.captures),
                refunded: sum(payment.refunds),
                currency: payment.currency,
                createdAt: payment.created_at,
                buyer: payment.buyer ? { name: payment.buyer.name, email: payment.buyer.email } : null,
            },
            existingOrderId,
            unlinkedOrders: unlinkedOrders.map(o => ({ id: o.id, total: Number(o.total_amount), createdAt: o.created_at })),
            savedCheckout: pending ? { addressId: pending.order_data.user_address_id, lastError: pending.last_error } : null,
            paidItems,
            customer,
        });
    }

    if (!pi) return NextResponse.json({ message: 'Missing pi, tabby or email param' }, { status: 400 });

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
// Body: { pi?, tabby_payment_id?, payment_method, user_id, user_address_id, items: [{ productId, quantity, price }] }
// Creates the missing order and sends the confirmation email.
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { pi, tabby_payment_id, payment_method = 'card', user_id, user_address_id, items, coupon_code } = await request.json();

    if (!user_id || !user_address_id || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields: user_id, user_address_id, items' }, { status: 400 });
    }
    if (items.some(i => !Number.isInteger(Number(i.productId)) || !Number.isInteger(Number(i.quantity)) || Number(i.quantity) < 1 || !(Number(i.price) >= 0))) {
        return NextResponse.json({ message: 'Every item needs a product, a quantity of 1 or more and a price.' }, { status: 400 });
    }

    const subtotal = Math.round(items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0) * 100) / 100;
    const shippingCost = calcShipping(items.reduce((s, i) => s + Number(i.quantity), 0));

    // The discount code the customer used, so the order matches what they paid.
    // Its active / end date / usage limit aren't checked: it was valid when they paid.
    let coupon = null;
    let discountAmount = 0;
    if (coupon_code && String(coupon_code).trim()) {
        await ensureCouponProductsColumn(db);
        const { rows } = await db.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [String(coupon_code).trim()]);
        coupon = rows[0];
        if (!coupon) return NextResponse.json({ message: `There's no discount code "${coupon_code}".` }, { status: 400 });
        discountAmount = calcCouponDiscount(coupon, items);
        if (discountAmount <= 0) {
            return NextResponse.json({ message: `${coupon.code} doesn't take anything off these products (check its minimum subtotal or the products it applies to).` }, { status: 400 });
        }
    }
    let totalAmount = Math.max(0, Math.round((subtotal + shippingCost - discountAmount) * 100) / 100);
    let stripePaymentIntentId = null;
    let tabbyPaymentId = null;
    let paidAmount = null;
    let paymentConfirmed = false;

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
        paymentConfirmed = true;
    } else if (payment_method === 'tabby') {
        const id = String(tabby_payment_id || '').trim();
        if (!id) return NextResponse.json({ message: 'Tabby recovery requires the Tabby payment ID.' }, { status: 400 });

        let payment;
        try {
            payment = await getTabbyPayment(id);
        } catch (error) {
            return NextResponse.json({ message: `Tabby couldn't find this payment: ${error.message}` }, { status: 400 });
        }
        if (!isTabbyPaid(payment.status)) {
            return NextResponse.json({ message: `This Tabby payment is "${tabbyStatus(payment.status)}", so the customer hasn't paid.` }, { status: 400 });
        }
        tabbyPaymentId = payment.id;
        paidAmount = parseFloat(payment.amount) || 0;
        paymentConfirmed = true;
    }

    const taxAmount = vatFromGross(totalAmount);
    if (tabbyPaymentId) await ensureTabbyPendingTable();

    await ensureBackorderColumns();
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        if (tabbyPaymentId) {
            // Same lock as checkout and Tabby's webhook, so only one of them can create this order
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`tabby:${tabbyPaymentId}`]);
            const existingId = await findOrderForTabbyPayment(tabbyPaymentId);
            if (existingId) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Order already exists for this payment: order #${existingId}`, orderId: existingId }, { status: 409 });
            }
        }

        const { rows } = await client.query(
            `INSERT INTO orders
                (user_address_id, payment_method, total_amount, tax_amount, subtotal,
                 shipping_cost, gift_wrap, gift_wrap_cost, discount_amount,
                 order_status, payment_confirmed, user_id, stripe_payment_intent_id, tabby_payment_id,
                 shipping_scheduled_date, redeemed_points, applied_coupon_id)
             VALUES ($1, $2, $3, $4, $5, $6, false, 0, $12,
                     'Confirmed', $7, $8, $9, $10,
                     NOW() + INTERVAL '7 days', 0, $11)
             RETURNING id`,
            [user_address_id, payment_method, totalAmount, taxAmount, subtotal, shippingCost,
             paymentConfirmed, user_id, stripePaymentIntentId, tabbyPaymentId, coupon?.id ?? null, discountAmount]
        );
        const orderId = rows[0].id;

        // The customer has already paid, so units the shelf can't cover become a
        // pre-order (lib/backorders.js) instead of pushing stock below zero
        let leadDays = 0;
        for (const item of items) {
            const { rows: [product] } = await client.query(
                'SELECT stock_quantity, backorder_lead_days FROM products WHERE id = $1 FOR UPDATE', [item.productId]
            );
            const fromShelf = Math.min(item.quantity, Math.max(0, Number(product?.stock_quantity) || 0));
            const short = item.quantity - fromShelf;
            if (short > 0) leadDays = Math.max(leadDays, Number(product?.backorder_lead_days) || 1);
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price, backordered_qty) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.productId, item.quantity, item.price, short]
            );
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [fromShelf, item.productId]
            );
        }
        if (leadDays > 0) {
            await client.query(
                'UPDATE orders SET awaiting_stock = true, promised_ship_by = $1 WHERE id = $2',
                [getPreorderInfo(leadDays).shipByISO, orderId]
            );
        }

        if (coupon) await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [coupon.id]);

        // Clear the user's cart now that the order is created
        await client.query('DELETE FROM user_carts WHERE user_id = $1', [user_id]);

        if (tabbyPaymentId) {
            await client.query(
                'UPDATE tabby_pending_orders SET order_id = $1, last_error = NULL, updated_at = NOW() WHERE tabby_payment_id = $2',
                [orderId, tabbyPaymentId]
            );
        }

        await client.query('COMMIT');

        // Send confirmation email
        let emailSent = false;
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

            const productIds = items.map(i => Number(i.productId));
            const { rows: products } = await db.query(
                'SELECT p.id, p.name, pi2.image_url FROM products p LEFT JOIN product_images pi2 ON p.id = pi2.product_id AND pi2.is_main = TRUE WHERE p.id = ANY($1)',
                [productIds]
            );
            const itemsWithDetails = items.map(item => {
                const p = products.find(pr => pr.id === Number(item.productId));
                return { ...item, name: p?.name || 'Product', imageUrl: p?.image_url || '' };
            });

            if (userEmail) {
                await sendOrderConfirmationEmail(userEmail, firstName, orderId, totalAmount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, 0, coupon?.code ?? null, payment_method, new Date(), null, tabbyPaymentId);
                emailSent = true;
            }
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendAdminNotificationEmail(adminEmail, orderId, userEmail || 'Unknown', totalAmount, shippingAddress, { paymentMethod: payment_method, tabbyPaymentId });
            }
        } catch (emailErr) {
            console.error('Recovery email failed (order still created):', emailErr);
        }

        return NextResponse.json({
            message: 'Order recovered successfully',
            orderId,
            emailSent,
            totalAmount,
            paidAmount,
            // Positive: the customer paid more than the order costs, so the difference is theirs to refund
            difference: paidAmount === null ? null : Math.round((paidAmount - totalAmount) * 100) / 100,
        }, { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Recovery failed', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
