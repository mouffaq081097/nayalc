import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Helper function to fetch order items for a given order ID using a specific client
const fetchOrderItems = async (orderId, client) => {
    const sql = `
        SELECT product_id as "productId", quantity, price
        FROM order_items
        WHERE order_id = $1;
    `;
    const { rows } = await client.query(sql, [orderId]);
    return rows.map(item => ({ ...item, price: parseFloat(item.price) }));
};

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get a single order by ID
 *     description: Retrieves a single order and its associated items by its ID.
 *     responses:
 *       200:
 *         description: The requested order with its items.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request, context) {
    const params = await context.params;
    const { orderId } = params;
    const client = await db.connect();
    try {
        const sql = `
            SELECT
                o.id,
                (u.first_name || ' ' || u.last_name) as "customerName",
                ua.customer_email as "customerEmail",
                ua.customer_phone as "customerPhone",
                ua.shipping_address as "shippingAddress",
                ua.city,
                ua.zip_code as "zipCode",
                o.payment_method as "paymentMethod",
                o.total_amount as "totalAmount",
                o.order_status as "orderStatus",
                o.shipping_scheduled_date as "shippingScheduledDate",
                o.payment_confirmed as "paymentConfirmed",
                o.created_at as "createdAt",
                o.updated_at as "updatedAt",
                o.user_id as "userId",
                o.user_address_id as "userAddressId"
            FROM orders o
            JOIN user_addresses ua ON o.user_address_id = ua.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1;
        `;
        const { rows: orderRows } = await client.query(sql, [orderId]);

        if (orderRows.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const order = orderRows[0];
        const items = await fetchOrderItems(order.id, client);

        return NextResponse.json({ ...order, items });

    } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
        return NextResponse.json({ message: 'Error fetching order from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}