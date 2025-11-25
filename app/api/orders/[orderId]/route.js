import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/mail';

// Helper function to fetch order items for a given order ID using a specific client
const fetchOrderItems = async (orderId, client, itemTable = 'order_items') => {
    const sql = `
        SELECT 
            oi.product_id as "productId", 
            oi.quantity, 
            oi.price,
            p.name,
            pi.image_url as "imageUrl"
        FROM ${itemTable} oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE oi.order_id = $1;
    `;
    const { rows } = await client.query(sql, [orderId]);
    return rows.map(item => ({ ...item, price: parseFloat(item.price), id: item.productId }));
};

const getFullOrderDetails = async (orderId, client) => {
    const tables = [
        { name: 'orders', itemsTable: 'order_items' },
        { name: 'delivered_orders', itemsTable: 'delivered_order_items' },
        { name: 'cancelled_orders', itemsTable: 'cancelled_order_items' },
    ];

    for (const table of tables) {
        const sql = `
            SELECT
                o.id,
                (u.first_name || ' ' || u.last_name) as "customerName",
                ua.customer_email as "customerEmail",
                o.total_amount as "totalAmount",
                o.tax_amount as "taxAmount",
                o.discount_amount as "discountAmount",
                o.order_status as "status",
                o.created_at as "createdAt",
                ua.address_line1 as "addressLine1",
                ua.address_line2 as "addressLine2",
                ua.city as "city",
                ua.state as "state",
                ua.zip_code as "postalCode",
                ua.country as "country",
                o.tracking_number as "trackingNumber",
                o.courier_name as "courierName",
                o.courier_website as "courierWebsite"
            FROM ${table.name} o
            JOIN user_addresses ua ON o.user_address_id = ua.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1;
        `;
        const { rows: orderRows } = await client.query(sql, [orderId]);

        if (orderRows.length > 0) {
            const order = orderRows[0];
            const items = await fetchOrderItems(order.id, client, table.itemsTable);
            
            const shippingAddress = {
                addressLine1: order.addressLine1,
                addressLine2: order.addressLine2,
                city: order.city,
                state: order.state,
                postalCode: order.postalCode,
                country: order.country,
            };

            return {
                ...order,
                items,
                shippingAddress,
                trackingNumber: order.trackingNumber,
                courierName: order.courierName,
                courierWebsite: order.courierWebsite,
            };
        }
    }

    return null; // Order not found in any table
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
        const orderDetails = await getFullOrderDetails(orderId, client);

        if (!orderDetails) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const subtotal = parseFloat(orderDetails.totalAmount) + parseFloat(orderDetails.discountAmount) + parseFloat(orderDetails.taxAmount);
        const totalAmount = parseFloat(orderDetails.totalAmount);
        const discountAmount = parseFloat(orderDetails.discountAmount);
        const taxAmount = parseFloat(orderDetails.taxAmount);

        return NextResponse.json({ 
            ...orderDetails, 
            subtotal,
            totalAmount,
            discountAmount,
            taxAmount
        });

    } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
        return NextResponse.json({ message: 'Error fetching order from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @swagger
 * /api/orders/{orderId}:
 *   put:
 *     summary: Update order status by ID
 *     description: Updates the status of a specific order by its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status of the order.
 *                 enum: [Pending, Processing, Shipped, Delivered, Cancelled]
 *               trackingNumber:
 *                 type: string
 *                 description: The tracking number for the order (optional).
 *               courierName:
 *                 type: string
 *                 description: The name of the courier (optional).
 *               courierWebsite:
 *                 type: string
 *                 description: The website URL of the courier (optional).
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *       400:
 *         description: Invalid status provided.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
    const params = await context.params;
    const { orderId } = params;
    const { status: newStatus, trackingNumber, courierName, courierWebsite } = await request.json(); // Accept trackingNumber, courierName, and courierWebsite
    const client = await db.connect();

    // Validate the incoming status
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
    }

    try {
        // Fetch current order details before updating
        const orderDetails = await getFullOrderDetails(orderId, client);

        if (!orderDetails) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        if (newStatus === 'Delivered') { // Handle Delivered status
            try {
                await client.query('BEGIN');

                // 1. Fetch the order details
                const orderToDeliver = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
                if (orderToDeliver.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
                }
                const deliveredOrderDetails = orderToDeliver.rows[0];

                // 2. Insert into delivered_orders table
                const insertDeliveredOrderSql = `
                    INSERT INTO delivered_orders (
                        id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                        order_status, shipping_scheduled_date, payment_confirmed, user_id,
                        applied_coupon_id, tracking_number, courier_name, courier_website,
                        created_at, updated_at, delivered_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW());
                `;
                const {
                    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                    order_status, shipping_scheduled_date, payment_confirmed, user_id,
                    applied_coupon_id, tracking_number, courier_name, courier_website,
                    created_at, updated_at
                } = deliveredOrderDetails;

                await client.query(insertDeliveredOrderSql, [
                    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                    newStatus, shipping_scheduled_date, payment_confirmed, user_id,
                    applied_coupon_id, tracking_number, courier_name, courier_website,
                    created_at, updated_at
                ]);

                // 3. Move order items to delivered_order_items table
                const orderItemsToDeliver = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
                for (const item of orderItemsToDeliver.rows) {
                    await client.query(
                        `INSERT INTO delivered_order_items (id, order_id, product_id, quantity, price)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.id, item.order_id, item.product_id, item.quantity, item.price]
                    );
                }

                // 4. Delete from orders table and order_items table
                await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
                await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

                await client.query('COMMIT');

            } catch (transactionError) {
                await client.query('ROLLBACK');
                console.error(`Error delivering and archiving order ${orderId}:`, transactionError);
                return NextResponse.json({ message: 'Error delivering and archiving order', error: transactionError.message }, { status: 500 });
            }
        } else if (newStatus === 'Cancelled') { // Handle Cancelled status
            try {
                await client.query('BEGIN');

                // 1. Fetch the order details
                const orderToCancel = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
                if (orderToCancel.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
                }
                const cancelledOrderDetails = orderToCancel.rows[0];

                // 2. Insert into cancelled_orders table
                const insertCancelledOrderSql = `
                    INSERT INTO cancelled_orders (
                        id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                        order_status, shipping_scheduled_date, payment_confirmed, user_id,
                        applied_coupon_id, tracking_number, courier_name, courier_website,
                        created_at, updated_at, cancelled_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW());
                `;
                const {
                    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                    order_status, shipping_scheduled_date, payment_confirmed, user_id,
                    applied_coupon_id, tracking_number, courier_name, courier_website,
                    created_at, updated_at
                } = cancelledOrderDetails;

                await client.query(insertCancelledOrderSql, [
                    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,
                    newStatus, shipping_scheduled_date, payment_confirmed, user_id,
                    applied_coupon_id, tracking_number, courier_name, courier_website,
                    created_at, updated_at
                ]);

                // 3. Move order items to cancelled_order_items table
                const orderItemsToCancel = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
                for (const item of orderItemsToCancel.rows) {
                    await client.query(
                        `INSERT INTO cancelled_order_items (id, order_id, product_id, quantity, price)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.id, item.order_id, item.product_id, item.quantity, item.price]
                    );
                }

                // 4. Delete from orders table and order_items table
                await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
                await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

                await client.query('COMMIT');

            } catch (transactionError) {
                await client.query('ROLLBACK');
                console.error(`Error cancelling and archiving order ${orderId}:`, transactionError);
                return NextResponse.json({ message: 'Error cancelling and archiving order', error: transactionError.message }, { status: 500 });
            }
        } else {
            // Existing update logic for other statuses (Processing, Shipped, Pending)
            let updateQuery = 'UPDATE orders SET order_status = $1, updated_at = NOW()';
            const queryParams = [newStatus];
            let paramIndex = 2;

            if (trackingNumber !== undefined) {
                updateQuery += `, tracking_number = $${paramIndex}`;
                queryParams.push(trackingNumber);
                paramIndex++;
            }
            if (courierName !== undefined) {
                updateQuery += `, courier_name = $${paramIndex}`;
                queryParams.push(courierName);
                paramIndex++;
            }
            if (courierWebsite !== undefined) {
                updateQuery += `, courier_website = $${paramIndex}`;
                queryParams.push(courierWebsite);
                paramIndex++;
            }

            updateQuery += ` WHERE id = $${paramIndex}`;
            queryParams.push(orderId);

            const { rowCount } = await client.query(updateQuery, queryParams);

            if (rowCount === 0) {
                return NextResponse.json({ message: 'Order not found' }, { status: 404 });
            }
        }
        // Send email if status is "Processing", "Shipped", "Delivered" or "Cancelled"
        if (newStatus === 'Processing' || newStatus === 'Shipped' || newStatus === 'Delivered' || newStatus === 'Cancelled') {
            try {
                // Fetch updated order details to ensure email has the latest info including tracking number
                const updatedOrderDetails = await getFullOrderDetails(orderId, client);
                if (!updatedOrderDetails) {
                    // If order is not found, it might have been moved (Delivered/Cancelled)
                    // In this case, we can use the details we fetched earlier.
                    const finalOrderDetails = (newStatus === 'Delivered' || newStatus === 'Cancelled') ? orderDetails : null;
                    if(!finalOrderDetails) throw new Error('Could not fetch updated order details for email.');
                    
                    console.log('--- Debugging email items ---');
                    console.log('finalOrderDetails.items:', finalOrderDetails.items);
                    console.log('--- End Debugging email items ---');
                    
                    await sendOrderStatusUpdateEmail(
                        finalOrderDetails.customerEmail,
                        finalOrderDetails.customerName,
                        finalOrderDetails.id,
                        newStatus,
                        parseFloat(finalOrderDetails.totalAmount),
                        parseFloat(finalOrderDetails.taxAmount),
                        parseFloat(finalOrderDetails.discountAmount),
                        finalOrderDetails.items,
                        finalOrderDetails.shippingAddress,
                        finalOrderDetails.trackingNumber,
                        finalOrderDetails.courierName,
                        finalOrderDetails.courierWebsite,
                        finalOrderDetails
                    );

                } else {
                    console.log('--- Debugging email items ---');
                    console.log('updatedOrderDetails.items:', updatedOrderDetails.items);
                    console.log('--- End Debugging email items ---');

                    await sendOrderStatusUpdateEmail(
                        updatedOrderDetails.customerEmail,
                        updatedOrderDetails.customerName,
                        updatedOrderDetails.id,
                        newStatus,
                        parseFloat(updatedOrderDetails.totalAmount),
                        parseFloat(updatedOrderDetails.taxAmount),
                        parseFloat(updatedOrderDetails.discountAmount),
                        updatedOrderDetails.items,
                        updatedOrderDetails.shippingAddress,
                        updatedOrderDetails.trackingNumber, // Pass tracking number to email
                        updatedOrderDetails.courierName, // Pass courier name to email
                        updatedOrderDetails.courierWebsite, // Pass courier website to email
                        updatedOrderDetails // Pass the entire orderDetails object for invoice generation
                    );
                }
                console.log(`Order ${orderId} ${newStatus} email sent to ${orderDetails.customerEmail}`);
            } catch (emailError) {
                console.error(`Failed to send ${newStatus} email for order ${orderId}:`, emailError);
            }
        }

        return NextResponse.json({ message: 'Order status updated successfully' }, { status: 200 });

    } catch (error) {
        console.error(`Error updating order ${orderId} status:`, error);
        return NextResponse.json({ message: 'Error updating order status in database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

