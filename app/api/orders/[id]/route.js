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
 * /api/orders/{id}:
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
export async function GET(request, { params }) {
    const { id } = params;
    const client = await db.connect();
    try {
        const sql = `SELECT id, customer_name as "customerName", customer_email as "customerEmail", customer_phone as "customerPhone", shipping_address as "shippingAddress", city, zip_code as "zipCode", payment_method as "paymentMethod", total_amount as "totalAmount", order_status as "orderStatus", shipping_scheduled_date as "shippingScheduledDate", payment_confirmed as "paymentConfirmed", created_at as "createdAt", updated_at as "updatedAt", user_id as "userId" FROM orders WHERE id = $1;`;
        const { rows: orderRows } = await client.query(sql, [id]);

        if (orderRows.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const order = orderRows[0];
        const items = await fetchOrderItems(order.id, client);

        return NextResponse.json({ ...order, items });

    } catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        return NextResponse.json({ message: 'Error fetching order from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
