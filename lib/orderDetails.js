import Stripe from 'stripe';
import db from './db.js';
import { ensureBackorderColumns } from './backorders.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * One order with its items, address and (for cards) the card used, wherever it
 * lives: open, delivered or cancelled. Returns null when there's no such order.
 * Callers decide who may see it: GET /api/orders/[orderId] (the owner or an
 * admin) and the guest order page (a signed order link).
 */
export async function getOrderDetails(orderId, { markViewed = false } = {}) {
    await ensureBackorderColumns();
    const client = await db.connect();
    try {
        if (markViewed) {
            // Mark as viewed by admin silently
            await client.query('UPDATE orders SET viewed_by_admin = true WHERE id = $1', [orderId]);
        }

        let orderResult;
        let items = [];

        // Try to find in orders table
        orderResult = await client.query(`
            SELECT
                o.*,
                o.order_status as status,
                o.total_amount as "totalAmount",
                o.created_at as "createdAt",
                o.tax_amount as "taxAmount",
                o.discount_amount as "discountAmount",
                o.shipping_cost as "shippingCost",
                o.gift_wrap_cost as "giftWrapCost",
                o.stripe_payment_intent_id as "stripePaymentIntentId",
                o.awaiting_stock as "awaitingStock",
                o.promised_ship_by::text as "promisedShipBy",
                COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as "customerName",
                COALESCE(u.email, '') as "customerEmail",
                ua.customer_phone as "customerPhone",
                ua.address_line1 as "shippingAddress",
                ua.address_line2 as "addressLine2",
                ua.city,
                ua.state,
                ua.country,
                ua.zip_code as "zipCode"
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
            WHERE o.id = $1
        `, [orderId]);

        if (orderResult.rows.length > 0) {
            const itemsResult = await client.query(`
                SELECT oi.id, oi.quantity, oi.price, oi.backordered_qty as "backorderedQty", p.id as "productId", p.name, pi.image_url as "imageUrl"
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                WHERE oi.order_id = $1
            `, [orderId]);
            items = itemsResult.rows;
        } else {
            // Try to find in delivered_orders table
            orderResult = await client.query(`
                SELECT
                    o.*,
                    o.order_status as status,
                    o.total_amount as "totalAmount",
                    o.created_at as "createdAt",
                    o.tax_amount as "taxAmount",
                    o.discount_amount as "discountAmount",
                    o.shipping_cost as "shippingCost",
                    o.gift_wrap_cost as "giftWrapCost",
                    o.stripe_payment_intent_id as "stripePaymentIntentId",
                    COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as "customerName",
                    COALESCE(u.email, '') as "customerEmail",
                    ua.customer_phone as "customerPhone",
                    ua.address_line1 as "shippingAddress",
                    ua.address_line2 as "addressLine2",
                    ua.city,
                    ua.state,
                    ua.country,
                    ua.zip_code as "zipCode"
                FROM delivered_orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
                WHERE o.id = $1
            `, [orderId]);

            if (orderResult.rows.length > 0) {
                const itemsResult = await client.query(`
                    SELECT doi.id, doi.quantity, doi.price, p.id as "productId", p.name, pi.image_url as "imageUrl"
                    FROM delivered_order_items doi
                    JOIN products p ON doi.product_id = p.id
                    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                    WHERE doi.order_id = $1
                `, [orderId]);
                items = itemsResult.rows;
            } else {
                // Try to find in cancelled_orders table
                orderResult = await client.query(`
                    SELECT
                        o.*,
                        o.order_status as status,
                        o.total_amount as "totalAmount",
                        o.created_at as "createdAt",
                        o.cancellation_reason as "cancellationReason",
                        o.tax_amount as "taxAmount",
                        o.discount_amount as "discountAmount",
                        o.shipping_cost as "shippingCost",
                        o.gift_wrap_cost as "giftWrapCost",
                        o.stripe_payment_intent_id as "stripePaymentIntentId",
                        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as "customerName",
                        COALESCE(u.email, '') as "customerEmail",
                        ua.customer_phone as "customerPhone",
                        ua.address_line1 as "shippingAddress",
                        ua.address_line2 as "addressLine2",
                        ua.city,
                        ua.state,
                        ua.country,
                        ua.zip_code as "zipCode"
                    FROM cancelled_orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
                    WHERE o.id = $1
                `, [orderId]);
                if (orderResult.rows.length > 0) {
                    const itemsResult = await client.query(`
                        SELECT coi.id, coi.quantity, coi.price, p.id as "productId", p.name, pi.image_url as "imageUrl"
                        FROM cancelled_order_items coi
                        JOIN products p ON coi.product_id = p.id
                        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                        WHERE coi.order_id = $1
                    `, [orderId]);
                    items = itemsResult.rows;
                }
            }
        }

        if (orderResult.rows.length === 0) return null;

        const order = orderResult.rows[0];

        // Common processing for the found order
        order.totalAmount    = parseFloat(order.totalAmount)    || 0;
        order.taxAmount      = parseFloat(order.taxAmount)      || 0;
        order.discountAmount = parseFloat(order.discountAmount) || 0;
        order.shippingCost   = parseFloat(order.shippingCost)   || 0;
        order.giftWrapCost   = parseFloat(order.giftWrapCost)   || 0;
        order.subtotal       = parseFloat(order.subtotal)       || 0;

        if (order.applied_coupon_id) {
            const { rows: couponRows } = await client.query('SELECT code FROM coupons WHERE id = $1', [order.applied_coupon_id]);
            order.coupon_code = couponRows[0]?.code ?? null;
        }

        // If payment method is card, fetch Stripe details for display
        if (order.paymentMethod === 'card' && order.stripePaymentIntentId) {
            try {
                const charges = await stripe.charges.list({
                    payment_intent: order.stripePaymentIntentId,
                    limit: 1, // Assuming only one charge per payment intent for simplicity
                });

                if (charges.data.length > 0) {
                    const charge = charges.data[0];
                    order.cardDetails = {
                        brand: charge.payment_method_details?.card?.brand,
                        last4: charge.payment_method_details?.card?.last4,
                        funding: charge.payment_method_details?.card?.funding,
                        network: charge.payment_method_details?.card?.network,
                        status: charge.status,
                    };
                }
            } catch (stripeError) {
                console.error('Error fetching Stripe PaymentIntent for user view:', stripeError);
                // Continue without card details if Stripe fetch fails
            }
        }

        order.shippingAddressDetails = {
            addressLine1: order.shippingAddress || '',
            addressLine2: order.addressLine2    || '',
            city:         order.city            || '',
            state:        order.state           || '',
            postalCode:   order.zipCode         || '',
            country:      order.country         || '',
        };

        order.items = items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price),
            backorderedQty: item.backorderedQty || 0,
            product: {
                id: item.productId,
                name: item.name,
                imageUrl: item.imageUrl
            }
        }));

        return order;
    } finally {
        client.release();
    }
}
