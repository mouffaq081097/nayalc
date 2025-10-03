import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Helper function to fetch order items for a given order ID using a specific client
const fetchOrderItems = async (orderId, client) => {
    const sql = `
        SELECT 
            oi.product_id as "productId", 
            oi.quantity, 
            oi.price,
            p.name,
            b.name as "brandName",
            pi.image_url as "imageUrl"
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE oi.order_id = $1;
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
        let sql = `
            SELECT
                o.id,
                ua.customer_name as "customerName",
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
        `;
        const params = [];

        if (userId) {
            sql += ` WHERE o.user_id = $1`;
            params.push(userId);
        }
        sql += ` ORDER BY o.created_at DESC;`;

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
        const { user_address_id, payment_method, total_amount, shipping_scheduled_date, user_id, items } = await request.json();

        if (!user_address_id || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Missing required order information or items.' }, { status: 400 });
        }

        await client.query('BEGIN');

        const insertOrderSql = `
            INSERT INTO orders (user_address_id, payment_method, total_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id)
            VALUES ($1, $2, $3, $4, $5, false, $6) RETURNING id;
        `;
        const orderValues = [user_address_id, payment_method, total_amount, 'pending', shipping_scheduled_date, user_id];
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
