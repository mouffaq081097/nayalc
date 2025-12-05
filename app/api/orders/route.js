import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail'; // Import the new functions

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        let baseSql = `
            SELECT
                o.id,
                ua.customer_email as "customerEmail",                ua.customer_phone as "customerPhone",
                ua.shipping_address as "shippingAddress",
                ua.city,
                ua.zip_code as "zipCode",
                o.payment_method as "paymentMethod",
                o.total_amount as "totalAmount",
                o.tax_amount as "taxAmount",
                o.order_status as "status",
                o.shipping_scheduled_date as "shippingScheduledDate",
                o.payment_confirmed as "paymentConfirmed",
                o.created_at as "createdAt",
                o.updated_at as "updatedAt",
                o.user_id as "userId",
                o.user_address_id as "userAddressId"
            FROM orders o
            JOIN user_addresses ua ON o.user_address_id = ua.id
        `;
        
        let countSql = `SELECT COUNT(*) FROM orders o JOIN user_addresses ua ON o.user_address_id = ua.id`;
        let whereClause = '';
        const params = [];
        let countParams = [];

        if (userId) {
            whereClause = ` WHERE o.user_id = $1`;
            params.push(userId);
            countParams.push(userId);
        }

        const totalCountResult = await client.query(countSql + whereClause, countParams);
        const totalCount = parseInt(totalCountResult.rows[0].count, 10);

        let paginatedSql = baseSql + whereClause + ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
        params.push(limit);
        params.push(offset);

        const { rows: orders } = await client.query(paginatedSql, params);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await fetchOrderItems(order.id, client);
            return { ...order, items };
        }));

        return NextResponse.json({
            orders: ordersWithItems,
            totalCount,
            page,
            limit
        });
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
        const { user_address_id, payment_method, total_amount, shipping_scheduled_date, user_id, items, taxAmount, applied_coupon_id, discount_amount, subtotal, shipping_cost, gift_wrap = false, gift_wrap_cost = 0 } = await request.json();

        if (!user_address_id || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0 || taxAmount === undefined || subtotal === undefined || shipping_cost === undefined) {
            return NextResponse.json({ message: 'Missing required order information or items.' }, { status: 400 });
        }

        await client.query('BEGIN');

        // --- Stock Validation ---
        for (const item of items) {
            const { rows: productRows } = await client.query(
                "SELECT stock_quantity FROM products WHERE id = $1",
                [item.productId]
            );

            if (productRows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Product with ID ${item.productId} not found.` }, { status: 400 });
            }

            const availableStock = productRows[0].stock_quantity;

            if (availableStock < item.quantity) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Insufficient stock for product ${item.name}. Available: ${availableStock}, Requested: ${item.quantity}.` }, { status: 400 });
            }
        }
        // --- End Stock Validation ---

        const insertOrderSql = "INSERT INTO orders (user_address_id, payment_method, total_amount, tax_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id, discount_amount, subtotal, shipping_cost, gift_wrap, gift_wrap_cost) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, $11, $12, $13) RETURNING id;";
        const orderValues = [user_address_id, payment_method, total_amount, taxAmount, 'Pending', shipping_scheduled_date, user_id, applied_coupon_id, discount_amount, subtotal, shipping_cost, gift_wrap, gift_wrap_cost];
        const { rows: orderRows } = await client.query(insertOrderSql, orderValues);
        const orderId = orderRows[0].id;

        if (applied_coupon_id) {
            await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [applied_coupon_id]);
        }

        const { rows: userRows } = await client.query('SELECT email, first_name FROM users WHERE id = $1', [user_id]);
        const userEmail = userRows.length > 0 ? userRows[0].email : null;
        const firstName = userRows.length > 0 ? userRows[0].first_name : 'Customer';
        

        const itemValues = items.map(item => `(${orderId}, ${item.productId}, ${item.quantity}, ${item.price})`).join(',');
        const insertItemsSql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES " + itemValues + ";";
        await client.query(insertItemsSql);

        // Deduct inventory for each item
        for (const item of items) {
            await client.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [item.quantity, item.productId]
            );
        }

        // Fetch shipping address details
        const { rows: addressRows } = await client.query(
            "SELECT shipping_address, city, zip_code, country FROM user_addresses WHERE id = $1",
            [user_address_id]
        );
        const shippingAddress = addressRows.length > 0 ? {
            street: addressRows[0].shipping_address,
            city: addressRows[0].city,
            zip: addressRows[0].zip_code,
            country: addressRows[0].country,
            state: '' // Assuming state is not stored or can be empty
        } : null;

        await client.query('COMMIT');

        if (userEmail) {
            const productIds = items.map(item => item.productId);
            const { rows: products } = await db.query(
                'SELECT p.id, p.name, pi.image_url FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE WHERE p.id = ANY($1)',
                [productIds]
            );
            const itemsWithDetails = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return { 
                    ...item, 
                    name: product ? product.name : 'Unknown Product',
                    imageUrl: product ? product.image_url : '' // Include imageUrl
                };
            });

            // Send order confirmation email to customer using Nodemailer
            await sendOrderConfirmationEmail(userEmail, firstName, orderId, total_amount, taxAmount, discount_amount, subtotal, shipping_cost, itemsWithDetails, shippingAddress, gift_wrap_cost);

            // Execute Python script for sending email to administrator
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendAdminNotificationEmail(adminEmail, orderId, userEmail, total_amount, shippingAddress);
            }
        } else {
            
        }

        return NextResponse.json({ message: 'Order created successfully', orderId }, { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return NextResponse.json({ message: 'Error creating order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}