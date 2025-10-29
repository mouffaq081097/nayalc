import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

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
                o.tax_amount as "taxAmount",
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
    console.log('--- NEW ORDER REQUEST ---');
    const client = await db.connect();
    try {
        const { user_address_id, payment_method, total_amount, shipping_scheduled_date, user_id, items, taxAmount } = await request.json();

        if (!user_address_id || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0 || taxAmount === undefined) {
            return NextResponse.json({ message: 'Missing required order information or items.' }, { status: 400 });
        }

        await client.query('BEGIN');

        const insertOrderSql = `
            INSERT INTO orders (user_address_id, payment_method, total_amount, tax_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, false, $7) RETURNING id;
        `;
        const orderValues = [user_address_id, payment_method, total_amount, taxAmount, 'pending', shipping_scheduled_date, user_id];
        const { rows: orderRows } = await client.query(insertOrderSql, orderValues);
        const orderId = orderRows[0].id;

        const { rows: userRows } = await client.query('SELECT email FROM users WHERE id = $1', [user_id]);
        const userEmail = userRows.length > 0 ? userRows[0].email : null;
        console.log('User Email:', userEmail);

        const itemValues = items.map(item => `(${orderId}, ${item.productId}, ${item.quantity}, ${item.price})`).join(',');
        const insertItemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${itemValues};`;
        await client.query(insertItemsSql);

        // Fetch shipping address details
        const { rows: addressRows } = await client.query(
            `SELECT shipping_address, city, zip_code, country FROM user_addresses WHERE id = $1`,
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

            // Execute Python script for sending email to customer
            const pythonScriptPath = './send_email.py';
            const customerSubject = 'Order Confirmation - nayalc.com';
            const customerBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
        .header { background-color: #007bff; color: white; padding: 25px 20px; text-align: center; }
        .header h2 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .content p { margin-bottom: 15px; }
        .order-summary { background-color: #e9f5ff; border-left: 5px solid #007bff; padding: 15px; margin-bottom: 25px; border-radius: 5px; }
        .order-summary p { margin: 5px 0; font-size: 1.1em; }
        .order-summary strong { color: #0056b3; }
        h3 { color: #007bff; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
        th { background-color: #f0f0f0; color: #555; font-weight: bold; }
        .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-top: 1px solid #e0e0e0; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your Order Confirmation - nayalc.com</h2>
        </div>
        <div class="content">
            <p>Dear Customer,</p>
            <p>Thank you for your recent purchase from nayalc.com! We're excited to confirm your order.</p>
            
            <div class="order-summary">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total Amount:</strong> AED ${total_amount.toFixed(2)}</p>
                <p><strong>Tax Amount:</strong> AED ${taxAmount.toFixed(2)}</p>
            </div>

            <h3>Order Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsWithDetails.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>AED ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Shipping Address</h3>
            <p>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.zip}<br>
                ${shippingAddress.country}
            </p>

            <p>We will send you another email with tracking information once your order has been shipped.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <a href="#" class="button">View Your Order</a> <!-- Placeholder for a link to order details -->
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
            <p><a href="#" style="color: #007bff;">Privacy Policy</a> | <a href="#" style="color: #007bff;">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
`;
            const encodedCustomerBody = Buffer.from(customerBody).toString('base64');
            const customerCommand = `python ${pythonScriptPath} "${userEmail}" "${customerSubject}" "${encodedCustomerBody}"`;

            exec(customerCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error (customer email): ${error}`);
                    return;
                }
                console.log(`stdout (customer email): ${stdout}`);
                console.error(`stderr (customer email): ${stderr}`);
            });

            // Execute Python script for sending email to administrator
            const adminEmail = 'mouffaq@nayalc.com'; // TODO: Replace with actual administrator email
            const adminSubject = `New Order #${orderId} - Action Required`;
            const adminBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background-color: #FFC107; color: white; padding: 10px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Order Received - Action Required!</h2>
        </div>
        <div class="content">
            <p>Dear Administrator,</p>
            <p>A new order has been placed on nayalc.com. Please process this order promptly.</p>
            
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer Email:</strong> ${userEmail}</p>
            <p><strong>Total Amount:</strong> AED ${total_amount.toFixed(2)}</p>
            <p><strong>Shipping Address:</strong></p>
            <p>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.zip}<br>
                ${shippingAddress.country}
            </p>

            <p>Please log in to the admin panel to view full order details and initiate shipping.</p>
            <p>Thank you,<br>nayalc.com Automated System</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
            const encodedAdminBody = Buffer.from(adminBody).toString('base64');
            const adminCommand = `python ${pythonScriptPath} "${adminEmail}" "${adminSubject}" "${encodedAdminBody}"`;

            exec(adminCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error (admin email): ${error}`);
                    return;
                }
                console.log(`stdout (admin email): ${stdout}`);
                console.error(`stderr (admin email): ${stderr}`);
            });
        } else {
            console.log('No user email found. Skipping email confirmation.');
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