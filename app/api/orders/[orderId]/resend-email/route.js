import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/mail';

export async function POST(request, { params }) {
    const orderId = params.orderId;

    const client = await db.connect();
    try {
        // Search across all three order tables
        const tables = [
            { order: 'orders', items: 'order_items' },
            { order: 'delivered_orders', items: 'delivered_order_items' },
            { order: 'cancelled_orders', items: 'cancelled_order_items' },
        ];

        let order = null;
        let items = [];

        for (const { order: orderTable, items: itemsTable } of tables) {
            const { rows: orderRows } = await client.query(`
                SELECT
                    o.id,
                    o.total_amount,
                    o.tax_amount,
                    o.discount_amount,
                    o.subtotal,
                    o.shipping_cost,
                    o.gift_wrap_cost,
                    o.applied_coupon_id,
                    u.email,
                    u.first_name,
                    ua.address_line1 as shipping_address,
                    ua.city,
                    ua.zip_code,
                    ua.country
                FROM ${orderTable} o
                JOIN users u ON o.user_id = u.id
                JOIN user_addresses ua ON o.user_address_id = ua.id
                WHERE o.id = $1
            `, [orderId]);

            if (orderRows.length > 0) {
                order = orderRows[0];

                const { rows: itemRows } = await client.query(`
                    SELECT
                        oi.quantity,
                        oi.price,
                        p.name,
                        pi.image_url as "imageUrl"
                    FROM ${itemsTable} oi
                    JOIN products p ON oi.product_id = p.id
                    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                    WHERE oi.order_id = $1
                `, [orderId]);
                items = itemRows;
                break;
            }
        }

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        let couponCode = null;
        if (order.applied_coupon_id) {
            const { rows: couponRows } = await client.query('SELECT code FROM coupons WHERE id = $1', [order.applied_coupon_id]);
            if (couponRows.length > 0) couponCode = couponRows[0].code;
        }

        const shippingAddress = {
            street: order.shipping_address,
            city: order.city,
            zip: order.zip_code,
            country: order.country,
        };

        await sendOrderConfirmationEmail(
            order.email,
            order.first_name,
            orderId,
            parseFloat(order.total_amount),
            parseFloat(order.tax_amount),
            parseFloat(order.discount_amount),
            parseFloat(order.subtotal),
            parseFloat(order.shipping_cost),
            items,
            shippingAddress,
            parseFloat(order.gift_wrap_cost) || 0,
            couponCode
        );

        return NextResponse.json({ message: 'Email resent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ message: 'Error resending email', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
