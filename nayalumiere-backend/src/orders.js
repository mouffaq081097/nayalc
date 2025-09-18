const express = require('express');
const db = require('./db');
const router = express.Router();

// Helper function to fetch order items for a given order ID
const fetchOrderItems = async (orderId, connection) => {
    const sql = `
        SELECT
            product_id,
            quantity,
            price
        FROM order_items
        WHERE order_id = ?;
    `;
    const [rows] = await connection.query(sql, [orderId]);
    return rows.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price), // Ensure price is a number
    }));
};

// Get all orders (optionally filtered by userId)
router.get('/', async (req, res) => { // Make it async
    const { userId } = req.query;
    let sql = `
        SELECT
            id,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            city,
            zip_code,
            payment_method,
            total_amount,
            order_status,
            shipping_scheduled_date,
            payment_confirmed,
            created_at,
            updated_at,
            user_id
        FROM orders
    `;
    const params = [];

    if (userId) {
        sql += ` WHERE user_id = ?`;
        params.push(userId);
    }

    sql += ` ORDER BY created_at DESC;`;

    let connection;
    try {
        connection = await db.promise().getConnection();
        const [orders] = await connection.query(sql, params);

        // Fetch items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await fetchOrderItems(order.id, connection);
            return {
                ...order,
                items: items,
                orderDate: order.created_at, // Use created_at as orderDate
                status: order.order_status, // Map order_status to status
                total: parseFloat(order.total_amount), // Map total_amount to total
            };
        }));

        res.json(ordersWithItems);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Error fetching orders from database', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Get a single order by ID
router.get('/:id', async (req, res) => { // Make it async
    const { id } = req.params;
    const sql = `
        SELECT
            id,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            city,
            zip_code,
            payment_method,
            total_amount,
            order_status,
            shipping_scheduled_date,
            payment_confirmed,
            created_at,
            updated_at,
            user_id
        FROM orders
        WHERE id = ?;
    `;
    let connection;
    try {
        connection = await db.promise().getConnection();
        const [result] = await connection.query(sql, [id]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result[0];
        const items = await fetchOrderItems(order.id, connection);

        res.json({
            ...order,
            items: items,
            orderDate: order.created_at,
            status: order.order_status,
            total: parseFloat(order.total_amount),
        });
    } catch (err) {
        console.error('Error fetching single order:', err);
        res.status(500).json({ message: 'Error fetching order from database', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// CREATE a new order
router.post('/', async (req, res) => { // Make it async
    const { customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, shipping_scheduled_date, user_id, items } = req.body; // Destructure items

    // Basic validation
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !zip_code || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Missing required order information or items.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const insertOrderSql = `
            INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, false, ?, NOW())
        `;

        const orderValues = [customer_name, customer_email, customer_phone, shipping_address, city, zip_code, payment_method, total_amount, shipping_scheduled_date, user_id];

        const [orderResult] = await connection.query(insertOrderSql, orderValues);
        const orderId = orderResult.insertId;

        // Insert order items
        const insertItemsSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?;';
        const itemValues = items.map(item => [orderId, item.productId, item.quantity, item.price]);

        await connection.query(insertItemsSql, [itemValues]);

        await connection.commit();
        res.status(201).json({ message: 'Order created successfully', orderId: orderId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Error creating order', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Fulfill an order (update its status to 'fulfilled')
router.put('/:id/fulfill', (req, res) => {
    const { id } = req.params;
    const sql = 'UPDATE orders SET order_status = ?, shipping_scheduled_date = NOW() WHERE id = ?';
    db.query(sql, ['fulfilled', id], (err, result) => {
        if (err) {
            console.error('Error fulfilling order:', err);
            return res.status(500).json({ message: 'Error fulfilling order in database', error: err.message });
        }
       if (result.affectedRows === 0) {
           return res.status(404).json({ message: 'Order not found or already fulfilled' });
       }
       res.json({ message: 'Order fulfilled successfully' });
   });
});

// Schedule an order for collection
router.put('/:id/schedule-collection', async (req, res) => {
    const { id } = req.params;
    const { shipping_scheduled_date } = req.body; // Only relevant field from new schema

    if (!shipping_scheduled_date) {
        return res.status(400).json({ message: 'shipping_scheduled_date is required.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const updateOrderSql = 'UPDATE orders SET order_status = ?, shipping_scheduled_date = ? WHERE id = ?';
        const [updateResult] = await connection.query(updateOrderSql, ['scheduled', shipping_scheduled_date, id]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found or already scheduled' });
        }

        await connection.commit();
        res.status(200).json({ message: `Order ${id} scheduled for collection successfully.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error scheduling collection for order:', error);
        res.status(500).json({ message: 'Failed to schedule collection for order.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Cancel an order
router.put('/:id/cancel', async (req, res) => {
    const { id } = req.params;
    // Assuming cancellation reason is not stored directly in orders table based on new schema
    // If needed, a separate cancellation table/logic would be required.

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const updateOrderSql = 'UPDATE orders SET order_status = ? WHERE id = ?';
        const [updateResult] = await connection.query(updateOrderSql, ['cancelled', id]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found or already cancelled' });
        }

        await connection.commit();
        res.status(200).json({ message: `Order ${id} cancelled successfully.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Failed to cancel order.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;