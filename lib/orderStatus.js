import db from './db.js';
import Stripe from 'stripe';
import { sendOrderStatusUpdateEmail } from './mail.js';
import { pointsForOrder, tierForSpend, WELCOME_BONUS_POINTS, WELCOME_BONUS_DESCRIPTION } from './loyalty.js';
import { ensureTabbyPaymentColumns } from './tabbyOrders.js';
import { ensureBackorderColumns, allocateStock } from './backorders.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** An open order with what the status email needs (numbers parsed, address structured, items), or null. */
async function fetchOpenOrder(client, orderId) {
    const currentOrderResult = await client.query(
        `SELECT
            o.id, o.user_address_id, o.payment_method, o.total_amount, o.tax_amount, o.discount_amount,
            o.order_status, o.shipping_scheduled_date, o.payment_confirmed, o.user_id, o.applied_coupon_id,
            o.tracking_number, o.courier_name, o.courier_website, o.created_at, o.updated_at,
            o.subtotal, o.shipping_cost, o.stripe_payment_intent_id, o.tabby_payment_id, o.gift_wrap, o.gift_wrap_cost,
            COALESCE(o.redeemed_points, 0) as redeemed_points,
            o.awaiting_stock,
            u.email as customer_email,
            ua.customer_phone,
            COALESCE(ua.shipping_address, '') as shipping_address,
            COALESCE(ua.city, '') as city,
            COALESCE(ua.zip_code, '') as zip_code,
            COALESCE(ua.country, '') as country,
            COALESCE(u.first_name, 'Customer') as first_name
        FROM orders o
        LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = $1`,
        [orderId]
    );
    if (currentOrderResult.rows.length === 0) return null;
    const currentOrder = currentOrderResult.rows[0];

    currentOrder.totalAmount = parseFloat(currentOrder.total_amount);
    currentOrder.taxAmount = parseFloat(currentOrder.tax_amount);
    currentOrder.discountAmount = parseFloat(currentOrder.discount_amount);
    currentOrder.subtotal = parseFloat(currentOrder.subtotal);
    currentOrder.shippingCost = parseFloat(currentOrder.shipping_cost);
    currentOrder.shippingAddressDetails = {
        addressLine1: currentOrder.shipping_address,
        city: currentOrder.city,
        postalCode: currentOrder.zip_code,
        country: currentOrder.country
    };

    const orderItemsResult = await client.query(
        `SELECT
            oi.id, oi.quantity, oi.price, oi.backordered_qty,
            p.id as "productId", p.name, pi.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE oi.order_id = $1`,
        [orderId]
    );
    currentOrder.items = orderItemsResult.rows.map(item => ({
        ...item,
        price: parseFloat(item.price)
    }));
    return currentOrder;
}

/** Emails the customer the order's new status. Returns { success, error } and never throws. */
async function sendStatusEmail(order, status, { cancellationReason = null, trackingNumber, courierName, courierWebsite, pointsEarned = null }) {
    if (!order.customer_email) return { success: false, error: 'The order has no customer email address.' };
    return sendOrderStatusUpdateEmail(
        order.customer_email,
        order.first_name,
        order.id,
        status,
        cancellationReason,
        order.totalAmount,
        order.taxAmount,
        order.discountAmount,
        order.subtotal,
        order.shippingCost,
        order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.image_url
        })),
        order.shippingAddressDetails,
        trackingNumber,
        courierName,
        courierWebsite,
        { // Simplified orderDetails for invoice generation
            id: order.id,
            createdAt: order.created_at,
            paymentMethod: order.payment_method,
            tabbyPaymentId: order.tabby_payment_id,
            customerName: order.first_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            shippingAddress: order.shippingAddressDetails,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxAmount: order.taxAmount,
            shippingCost: order.shippingCost,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
        },
        pointsEarned
    );
}

/** Sends an open order's current status email again, e.g. after the first send failed. */
export async function resendStatusEmail(orderId) {
    const client = await db.connect();
    try {
        const order = await fetchOpenOrder(client, orderId);
        if (!order) return { status: 404, body: { message: 'Only open orders can be resent. Delivered and cancelled orders are archived.' } };
        const email = await sendStatusEmail(order, order.order_status, {
            trackingNumber: order.tracking_number,
            courierName: order.courier_name,
            courierWebsite: order.courier_website,
        });
        if (!email.success) {
            return { status: 502, body: { message: `The email to ${order.customer_email || 'the customer'} could not be sent: ${email.error}` } };
        }
        return { status: 200, body: { message: 'Sent', customerEmail: order.customer_email } };
    } finally {
        client.release();
    }
}

/**
 * Moves an order to a new status and does everything that comes with it:
 * Delivered archives the order and pays loyalty points, Cancelled refunds,
 * restocks and archives, anything else updates it in place. Then the customer
 * is emailed. The admin order page and the OTO webhook both go through here,
 * so a status set by either has exactly the same effect.
 *
 * Returns { status, body } — the HTTP status and JSON body for the caller.
 */
export async function updateOrderStatus(orderId, { status, cancellationReason = null, trackingNumber = null, courierName = null, courierWebsite = null }) {
    if (!status) {
        return { status: 400, body: { message: 'Status is required' } };
    }

    const client = await db.connect();
    let pointsEarned = 0;
    try {
        // Archived orders keep their Tabby payment ID (the column is added on first use)
        await ensureTabbyPaymentColumns();
        await ensureBackorderColumns();

        await client.query('BEGIN');

        // Fetch current order details before potential move or update, including fields for email
        const currentOrder = await fetchOpenOrder(client, orderId);
        if (!currentOrder) {
            await client.query('ROLLBACK');
            return { status: 404, body: { message: 'Order not found' } };
        }

        // A pre-order can't leave the warehouse until its stock has arrived (lib/backorders.js)
        if (currentOrder.awaiting_stock && (status === 'Shipped' || status === 'Delivered')) {
            await client.query('ROLLBACK');
            const owed = currentOrder.items.filter(item => item.backordered_qty > 0)
                .map(item => `${item.backordered_qty} × ${item.name}`).join(', ');
            return { status: 409, body: { message: `This order is awaiting stock (${owed}). Add the stock to the product first; the order is released automatically.` } };
        }

        // --- Handle Status Transitions ---
        if (status === 'Delivered') {
            const deliveredOrderSql = "INSERT INTO delivered_orders (\n" +
                "    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,\n" +
                "    order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id,\n" +
                "    tracking_number, courier_name, courier_website, created_at, updated_at, delivered_at,\n" +
                "    subtotal, shipping_cost, stripe_payment_intent_id, gift_wrap, gift_wrap_cost,\n" +
                "    redeemed_points, tabby_payment_id\n" +
                ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, $18, $19, $20, $21, $22, $23)";

            const deliveredOrderValues = [
                currentOrder.id,
                currentOrder.user_address_id,
                currentOrder.payment_method,
                currentOrder.total_amount,
                currentOrder.tax_amount,
                currentOrder.discount_amount,
                status, // new status
                currentOrder.shipping_scheduled_date,
                currentOrder.payment_confirmed,
                currentOrder.user_id,
                currentOrder.applied_coupon_id,
                trackingNumber || currentOrder.tracking_number,
                courierName ?? currentOrder.courier_name,
                courierWebsite ?? currentOrder.courier_website,
                currentOrder.created_at,
                currentOrder.updated_at,
                currentOrder.subtotal,
                // The query returns snake_case; reading camelCase here wrote a
                // null shipping cost onto every delivered order.
                currentOrder.shipping_cost,
                currentOrder.stripe_payment_intent_id,
                currentOrder.gift_wrap,
                currentOrder.gift_wrap_cost,
                currentOrder.redeemed_points,
                currentOrder.tabby_payment_id ?? null,
            ];
            await client.query(deliveredOrderSql, deliveredOrderValues);

            // Move order items (inventory already decremented at order creation — do not decrement again)
            for (const item of currentOrder.items) {
                await client.query(
                    "INSERT INTO delivered_order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                    [currentOrder.id, item.productId, item.quantity, item.price]
                );
            }

            await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

            // --- LOYALTY SYSTEM: Earn Points (inside transaction — failure rolls back delivery) ---
            const userLoyaltyRes = await client.query(
                'SELECT loyalty_points, lifetime_spend, loyalty_tier FROM users WHERE id = $1',
                [currentOrder.user_id]
            );

            if (userLoyaltyRes.rows.length > 0) {
                const userLoyalty = userLoyaltyRes.rows[0];

                // Earn on the product subtotal only — never on the VAT we remit
                // or the shipping we don't profit from. Rates live in lib/loyalty.js.
                const earnBase = parseFloat(currentOrder.subtotal) || 0;
                pointsEarned = pointsForOrder(earnBase, userLoyalty.loyalty_tier);

                await client.query(
                    'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
                    [currentOrder.user_id, 'earn', pointsEarned, `Earned from Order #${orderId}`, orderId]
                );

                // The welcome bonus is paid on the first order a member actually
                // receives, rather than at signup, so an account alone earns nothing.
                const { rows: priorWelcome } = await client.query(
                    "SELECT 1 FROM loyalty_transactions WHERE user_id = $1 AND type = 'welcome' LIMIT 1",
                    [currentOrder.user_id]
                );
                let welcomeBonus = 0;
                if (priorWelcome.length === 0) {
                    welcomeBonus = WELCOME_BONUS_POINTS;
                    await client.query(
                        'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
                        [currentOrder.user_id, 'welcome', welcomeBonus, WELCOME_BONUS_DESCRIPTION, orderId]
                    );
                }

                // Tier progress still tracks what the customer actually paid.
                const newLifetimeSpend = parseFloat(userLoyalty.lifetime_spend) + parseFloat(currentOrder.total_amount);
                const newTier = tierForSpend(newLifetimeSpend).name;

                await client.query(
                    'UPDATE users SET loyalty_points = loyalty_points + $1, lifetime_spend = $2, loyalty_tier = $3 WHERE id = $4',
                    [pointsEarned + welcomeBonus, newLifetimeSpend, newTier, currentOrder.user_id]
                );
            }
            // --- END LOYALTY SYSTEM ---

        } else if (status === 'Cancelled') {
            // Issue Stripe refund for card payments
            if (currentOrder.payment_method === 'card' && currentOrder.stripe_payment_intent_id) {
                try {
                    await stripe.refunds.create({ payment_intent: currentOrder.stripe_payment_intent_id });
                } catch (stripeErr) {
                    console.error(`Stripe refund failed for order ${orderId}:`, stripeErr.message);
                    // Do not abort — admin can manually refund in Stripe dashboard
                }
            }

            // Restore redeemed loyalty points
            if (currentOrder.redeemed_points > 0) {
                await client.query(
                    'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
                    [currentOrder.redeemed_points, currentOrder.user_id]
                );
                await client.query(
                    'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
                    [currentOrder.user_id, 'refund', currentOrder.redeemed_points, `Points refunded for cancelled Order #${orderId}`, orderId]
                );
            }

            // Reverse coupon usage count
            if (currentOrder.applied_coupon_id) {
                await client.query(
                    'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = $1',
                    [currentOrder.applied_coupon_id]
                );
            }

            await client.query(
                `INSERT INTO cancelled_orders (
                    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                    order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id,
                    tracking_number, courier_name, courier_website, created_at, updated_at, cancelled_at,
                    cancellation_reason, stripe_payment_intent_id, gift_wrap, gift_wrap_cost,
                    subtotal, shipping_cost, redeemed_points, tabby_payment_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),$17,$18,$19,$20,$21,$22,$23,$24)`,
                [
                    currentOrder.id,
                    currentOrder.user_address_id,
                    currentOrder.payment_method,
                    currentOrder.total_amount,
                    currentOrder.tax_amount,
                    currentOrder.discount_amount,
                    status,
                    currentOrder.shipping_scheduled_date,
                    currentOrder.payment_confirmed,
                    currentOrder.user_id,
                    currentOrder.applied_coupon_id,
                    trackingNumber || currentOrder.tracking_number,
                    courierName ?? currentOrder.courier_name,
                    courierWebsite ?? currentOrder.courier_website,
                    currentOrder.created_at,
                    currentOrder.updated_at,
                    cancellationReason,
                    currentOrder.stripe_payment_intent_id,
                    currentOrder.gift_wrap,
                    currentOrder.gift_wrap_cost,
                    currentOrder.subtotal,
                    currentOrder.shipping_cost,
                    currentOrder.redeemed_points,
                    currentOrder.tabby_payment_id ?? null,
                ]
            );

            // Move order items and restore inventory — only the units that were
            // actually set aside; pre-ordered units still owed never left the shelf
            for (const item of currentOrder.items) {
                await client.query(
                    'INSERT INTO cancelled_order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [currentOrder.id, item.productId, item.quantity, item.price]
                );
                await client.query(
                    'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                    [item.quantity - (item.backordered_qty || 0), item.productId]
                );
            }
            await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

        } else {
            // Update status and tracking info in the 'orders' table
            const updateOrderSql = "UPDATE orders\n" +
                "SET \n" +
                "    order_status = $1,\n" +
                "    tracking_number = $2,\n" +
                "    courier_name = $3,\n" +
                "    courier_website = $4,\n" +
                "    cancellation_reason = $5,\n" +
                "    updated_at = NOW()\n" +
                "WHERE id = $6";

            const updateOrderValues = [
                status,
                trackingNumber,
                courierName,
                courierWebsite,
                cancellationReason,
                orderId,
            ];
            await client.query(updateOrderSql, updateOrderValues);
        }

        await client.query('COMMIT');

        // Units returned by a cancellation go to whoever is waiting on a pre-order first
        if (status === 'Cancelled') {
            try {
                await allocateStock(currentOrder.items.map(item => item.productId));
            } catch (allocErr) {
                console.error(`Stock allocation after cancelling order ${orderId} failed:`, allocErr);
            }
        }

        // Send email after commit so DB state is consistent if email fails.
        // The result goes back to the caller so a failed send is visible, not just logged.
        const email = await sendStatusEmail(currentOrder, status, {
            cancellationReason,
            trackingNumber: trackingNumber || currentOrder.tracking_number,
            courierName: courierName ?? currentOrder.courier_name,
            courierWebsite: courierWebsite ?? currentOrder.courier_website,
            pointsEarned: status === 'Delivered' ? pointsEarned : null,
        });
        if (!email.success) console.error(`Status email for order ${orderId} (${status}) failed:`, email.error);

        // Determine response based on whether the order was moved or just updated
        const moved = status === 'Delivered' || status === 'Cancelled';
        const responseData = {
            message: "Order " + orderId + " updated to " + status + (moved ? " and moved" : ""),
            moved,
            emailSent: email.success,
            emailError: email.success ? null : email.error,
            customerEmail: currentOrder.customer_email,
        };


        return { status: 200, body: responseData };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating order:', error);
        return { status: 500, body: { message: 'Error updating order', error: error.message } };
    } finally {
        client.release();
    }
}
