import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail'; // Import the new functions

// Helper function to fetch order items for a given order ID and item table name
const fetchOrderItems = async (orderId, itemTableName, client) => {
    const sql = `
        SELECT
            oi.product_id as "productId",
            oi.quantity,
            oi.price,
            p.name,
            b.name as "brandName",
            pi.image_url as "imageUrl"
        FROM ${itemTableName} oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE oi.order_id = $1;
    `;
    const { rows } = await client.query(sql, [orderId]);
    return rows.map(item => ({ ...item, price: parseFloat(item.price) }));
};

// Helper function to select common order fields
const selectOrderFields = (tableName) => `
    SELECT
        o.id,
        ua.customer_email as "customerEmail",
        ua.customer_phone as "customerPhone",
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
        o.user_address_id as "userAddressId",
        ${tableName === 'orders' || tableName === 'delivered_orders' ? 'o.subtotal,' : 'NULL as subtotal,'}
        ${tableName === 'orders' || tableName === 'delivered_orders' ? 'o.shipping_cost,' : 'NULL as shipping_cost,'}
        ${tableName === 'orders' ? 'o.gift_wrap,' : 'NULL as gift_wrap,'}
        ${tableName === 'orders' ? 'o.gift_wrap_cost,' : 'NULL as gift_wrap_cost,'}
        o.discount_amount as "discountAmount",
        o.applied_coupon_id as "appliedCouponId",
        ${tableName === 'cancelled_orders' ? 'o.cancellation_reason as "cancellationReason",' : 'NULL as "cancellationReason",'}
        ${tableName === 'delivered_orders' ? 'o.delivered_at as "deliveredAt",' : 'NULL as "deliveredAt",'}
        o.tracking_number as "trackingNumber",
        o.courier_name as "courierName",
        o.courier_website as "courierWebsite"
    FROM ${tableName} o
    JOIN user_addresses ua ON o.user_address_id = ua.id
`;


/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders with optional filtering by user ID and status
 *     description: Retrieves orders, optionally filtered by user ID and order status. Supports pagination.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: The ID of the user to filter orders by.
 *       - in: query
 *         name: statusFilter
 *         schema:
 *           type: string
 *           enum: [all, pending, delivered, cancelled]
 *         description: Filter orders by status. 'all' includes pending, delivered, and cancelled orders. Defaults to 'pending'.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       200:
 *         description: A list of orders with their items and pagination info.
 *       500:
 *         description: Server error.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statusFilter = searchParams.get('statusFilter') || 'pending'; // 'all', 'pending', 'delivered', 'cancelled'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        let orderTableConfig = [];

        if (statusFilter === 'all' || statusFilter === 'pending') {
            orderTableConfig.push({ name: 'orders', itemTable: 'order_items', statusValue: 'Pending' });
        }
        if (statusFilter === 'all' || statusFilter === 'delivered') {
            orderTableConfig.push({ name: 'delivered_orders', itemTable: 'delivered_order_items', statusValue: 'Delivered' });
        }
        if (statusFilter === 'all' || statusFilter === 'cancelled') {
            orderTableConfig.push({ name: 'cancelled_orders', itemTable: 'cancelled_order_items', statusValue: 'Cancelled' });
        }

        let combinedSql = [];
        let combinedCountSql = [];
        const userIdParams = []; // Parameters specific to userId
        let selectParamIndex = 1; // Index for parameters in the SELECT query
        let countParamIndex = 1; // Index for parameters in the COUNT query

        for (const config of orderTableConfig) {
            let currentSelectSql = selectOrderFields(config.name);
            let currentCountSql = `SELECT COUNT(*) FROM ${config.name} o JOIN user_addresses ua ON o.user_address_id = ua.id`;
            let whereClause = '';

            // Add userId filter if present
            if (userId) {
                whereClause += (whereClause ? ' AND' : ' WHERE') + ` o.user_id = $${selectParamIndex++}`;
                // Only add userId to userIdParams once per union part.
                // For the count query, it needs its own parameter indexing.
                // We'll build userIdParams for the count query separately.
            }

            // Add specific status filter if not 'all'
            if (statusFilter !== 'all') {
                 whereClause += (whereClause ? ' AND' : ' WHERE') + ` o.order_status = '${config.statusValue}'`;
            }

            combinedSql.push(currentSelectSql + whereClause);
            
            // For count queries, parameters are simpler
            let currentCountWhereClause = '';
            if (userId) {
                currentCountWhereClause += (currentCountWhereClause ? ' AND' : ' WHERE') + ` o.user_id = $${countParamIndex++}`;
                if (userIdParams.length === 0 || userIdParams[userIdParams.length - 1] !== userId) { // Avoid duplicate userId in array if multiple union parts exist
                    userIdParams.push(userId);
                }
            }
            if (statusFilter !== 'all') {
                 currentCountWhereClause += (currentCountWhereClause ? ' AND' : ' WHERE') + ` o.order_status = '${config.statusValue}'`;
            }
            combinedCountSql.push(currentCountSql + currentCountWhereClause);
        }
        
        // Handle case where no tables are selected due to statusFilter
        if (combinedSql.length === 0) {
            return NextResponse.json({ orders: [], totalCount: 0, page, limit });
        }

        const fullQuery = combinedSql.join(' UNION ALL ') + ` ORDER BY "createdAt" DESC LIMIT $${selectParamIndex++} OFFSET $${selectParamIndex++};`;
        const fullCountQuery = combinedCountSql.join(' UNION ALL ');
        
        // Execute the count query with its specific parameters
        const totalCountResult = await client.query(fullCountQuery, userIdParams);
        const totalCount = totalCountResult.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

        // Prepare parameters for the full SELECT query
        const fullSelectQueryParams = [...userIdParams]; // Start with userId params
        fullSelectQueryParams.push(limit);
        fullSelectQueryParams.push(offset);

        const { rows: orders } = await client.query(fullQuery, fullSelectQueryParams);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            // Determine the correct item table based on order status
            let itemTable;
            if (order.status === 'Delivered') {
                itemTable = 'delivered_order_items';
            } else if (order.status === 'Cancelled') {
                itemTable = 'cancelled_order_items';
            } else { // Default to 'order_items' for 'Pending' or other statuses
                itemTable = 'order_items';
            }
            const items = await fetchOrderItems(order.id, itemTable, client);
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

        console.log('Order created successfully with ID:', orderId);
        return NextResponse.json({ message: 'Order created successfully', orderId }, { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return NextResponse.json({ message: 'Error creating order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}