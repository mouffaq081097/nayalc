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
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieves all orders, optionally filtered by user ID. Includes order items for each order.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: The ID of the user to filter orders by.
 *     responses:
 *       200:
 *         description: A list of orders with their items.
 *       500:
 *         description: Server error.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const client = await db.connect();
    try {
        let sql = `SELECT id, customer_name as "customerName", customer_email as "customerEmail", customer_phone as "customerPhone", shipping_address as "shippingAddress", city, zip_code as "zipCode", payment_method as "paymentMethod", total_amount as "totalAmount", order_status as "orderStatus", shipping_scheduled_date as "shippingScheduledDate", payment_confirmed as "paymentConfirmed", created_at as "createdAt", updated_at as "updatedAt", user_id as "userId" FROM orders`;
        const params = [];

        if (userId) {
            sql += ` WHERE user_id = $1`;
            params.push(userId);
        }
        sql += ` ORDER BY created_at DESC;`;

        const { rows: orders } = await client.query(sql, params);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await fetchOrderItems(order.id, client);
            return { ...order, items };
        }));

        return NextResponse.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ message: 'Error fetching orders from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order and its associated order items in a transaction.
 *     responses:
 *       201:
 *         description: Order created successfully.
 *       400:
 *         description: Bad request, missing required fields.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
    const client = await db.connect();
    try {
        const { customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, shipping_scheduled_date, user_id, items } = await request.json();

        if (!customer_name || !customer_email || !shipping_address || !city || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Missing required order information or items.' }, { status: 400 });
        }

        await client.query('BEGIN');

        const insertOrderSql = `
            INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, false, $10) RETURNING id;
        `;
        const orderValues = [customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, shipping_scheduled_date, user_id];
        const { rows: orderRows } = await client.query(insertOrderSql, orderValues);
        const orderId = orderRows[0].id;

        const itemValues = items.map(item => `(${orderId}, ${item.productId}, ${item.quantity}, ${item.price})`).join(',');
        const insertItemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${itemValues};`;
        await client.query(insertItemsSql);

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Order created successfully', orderId }, { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return NextResponse.json({ message: 'Error creating order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
