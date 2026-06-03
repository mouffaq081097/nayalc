import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail';
import Stripe from 'stripe';
import { getTabbyPayment } from '@/lib/tabby';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        u.email as "customerEmail",
        ua.customer_phone as "customerPhone",
        ua.shipping_address as "shippingAddress",
        ua.city,
        ua.zip_code as "zipCode",
        o.payment_method as "paymentMethod",
        o.total_amount::numeric as "totalAmount",
        o.tax_amount::numeric as "taxAmount",
        o.order_status as "status",
        o.shipping_scheduled_date as "shippingScheduledDate",
        o.payment_confirmed as "paymentConfirmed",
        o.created_at as "createdAt",
        o.updated_at as "updatedAt",
        o.user_id as "userId",
        o.user_address_id as "userAddressId",
        o.subtotal::numeric as subtotal,
        o.shipping_cost::numeric as shipping_cost,
        o.gift_wrap,
        o.gift_wrap_cost::numeric as gift_wrap_cost,
        o.discount_amount::numeric as "discountAmount",
        o.applied_coupon_id as "appliedCouponId",
        ${tableName === 'cancelled_orders' ? 'o.cancellation_reason::text' : 'NULL::text'} as "cancellationReason",
        ${tableName === 'delivered_orders' ? 'o.delivered_at::timestamptz' : 'NULL::timestamptz'} as "deliveredAt",
        o.tracking_number as "trackingNumber",
        o.courier_name as "courierName",
        o.courier_website as "courierWebsite",
        (SELECT points FROM loyalty_transactions WHERE order_id = o.id AND type = 'earn' LIMIT 1) as "pointsEarned"
    FROM ${tableName} o
    LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
    LEFT JOIN users u ON o.user_id = u.id
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
            let currentCountSql = `SELECT COUNT(*) FROM ${config.name} o LEFT JOIN user_addresses ua ON o.user_address_id = ua.id`;
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

        // Batch item fetching: group order IDs by source table, then do at most 3 queries
        const idsByTable = { order_items: [], delivered_order_items: [], cancelled_order_items: [] };
        for (const order of orders) {
            if (order.status === 'Delivered') idsByTable.delivered_order_items.push(order.id);
            else if (order.status === 'Cancelled') idsByTable.cancelled_order_items.push(order.id);
            else idsByTable.order_items.push(order.id);
        }

        const itemsByOrderId = {};
        for (const [table, ids] of Object.entries(idsByTable)) {
            if (ids.length === 0) continue;
            const { rows: itemRows } = await client.query(
                `SELECT oi.order_id, oi.product_id as "productId", oi.quantity, oi.price,
                        p.name, b.name as "brandName", pi.image_url as "imageUrl"
                 FROM ${table} oi
                 JOIN products p ON oi.product_id = p.id
                 LEFT JOIN brands b ON p.brand_id = b.id
                 LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                 WHERE oi.order_id = ANY($1)`,
                [ids]
            );
            for (const item of itemRows) {
                if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
                itemsByOrderId[item.order_id].push({ ...item, price: parseFloat(item.price) });
            }
        }

        const ordersWithItems = orders.map(order => ({ ...order, items: itemsByOrderId[order.id] || [] }));

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
const GIFT_WRAP_FEE = 100; // AED — authoritative server constant

export async function POST(request) {

    const client = await db.connect();
    try {
        const {
            user_address_id, payment_method, total_amount, shipping_scheduled_date,
            user_id, items,
            applied_coupon_id,
            gift_wrap = false,
            stripe_payment_intent_id = null,
            tabby_payment_id = null,
            redeemed_points = 0,
            gift_message = null,
        } = await request.json();

        if (!user_address_id || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'Missing required order information or items.' }, { status: 400 });
        }

        // Validate quantities are positive integers (L7)
        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return NextResponse.json({ message: `Invalid quantity for product ${item.productId}.` }, { status: 400 });
            }
        }

        await client.query('BEGIN');

        // --- Address Ownership Check (H4) ---
        const { rows: addrRows } = await client.query(
            'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
            [user_address_id, user_id]
        );
        if (addrRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Invalid shipping address.' }, { status: 400 });
        }

        // --- Stock Validation + Real Price Fetch (C1, C3, L6) ---
        // SELECT FOR UPDATE acquires row locks, preventing concurrent oversell
        const dbPriceMap = {};
        for (const item of items) {
            let productRows;
            try {
                ({ rows: productRows } = await client.query(
                    'SELECT stock_quantity, price, is_active FROM products WHERE id = $1 FOR UPDATE',
                    [item.productId]
                ));
            } catch (colErr) {
                // Fallback if is_active column doesn't exist (L6 best-effort)
                ({ rows: productRows } = await client.query(
                    'SELECT stock_quantity, price FROM products WHERE id = $1 FOR UPDATE',
                    [item.productId]
                ));
            }

            if (productRows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Product with ID ${item.productId} not found.` }, { status: 400 });
            }

            const product = productRows[0];

            if (product.is_active === false) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Product ${item.productId} is no longer available.` }, { status: 400 });
            }

            if (product.stock_quantity < item.quantity) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: `Insufficient stock for product ID ${item.productId}. Available: ${product.stock_quantity}, Requested: ${item.quantity}.` }, { status: 400 });
            }

            dbPriceMap[item.productId] = parseFloat(product.price);
        }
        // --- End Stock Validation ---

        // --- Server-Side Total Calculation (C2) ---
        const serverSubtotal = items.reduce((sum, item) => sum + dbPriceMap[item.productId] * item.quantity, 0);
        const serverTax = Math.round(serverSubtotal * 0.05 * 100) / 100;
        const serverShipping = serverSubtotal > 200 ? 0 : 30;
        const serverGiftWrap = gift_wrap ? GIFT_WRAP_FEE : 0;

        // --- Coupon Revalidation (H1) ---
        let serverCouponDiscount = 0;
        let couponCode = null;
        let resolvedCouponId = null;
        if (applied_coupon_id) {
            const { rows: couponRows } = await client.query(
                'SELECT id, code, is_active, expiration_date, usage_limit, usage_count, minimum_purchase_amount, discount_type, discount_value FROM coupons WHERE id = $1',
                [applied_coupon_id]
            );
            if (couponRows.length > 0) {
                const coupon = couponRows[0];
                const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                const isOverLimit = coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit;
                const belowMinimum = coupon.minimum_purchase_amount !== null && serverSubtotal < coupon.minimum_purchase_amount;
                if (coupon.is_active && !isExpired && !isOverLimit && !belowMinimum) {
                    serverCouponDiscount = coupon.discount_type === 'percentage'
                        ? Math.round(serverSubtotal * coupon.discount_value / 100 * 100) / 100
                        : parseFloat(coupon.discount_value);
                    couponCode = coupon.code;
                    resolvedCouponId = coupon.id;
                }
                // If coupon is invalid at order time, proceed without discount
            }
        }

        // --- Loyalty Points Validation (H2) ---
        const parsedRedeemedPoints = parseInt(redeemed_points, 10) || 0;
        const serverPointsDiscount = Math.floor(parsedRedeemedPoints / 100) * 5;

        if (parsedRedeemedPoints > 0) {
            // Lock user row to prevent parallel redemptions
            const userLoyaltyRes = await client.query(
                'SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE',
                [user_id]
            );
            if (!userLoyaltyRes.rows[0] || userLoyaltyRes.rows[0].loyalty_points < parsedRedeemedPoints) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Insufficient loyalty points.' }, { status: 400 });
            }
        }

        // --- Server Total Verification (C2) ---
        const serverTotal = Math.max(0, serverSubtotal + serverTax + serverShipping + serverGiftWrap - serverCouponDiscount - serverPointsDiscount);
        const clientTotal = parseFloat(total_amount);
        if (Math.abs(serverTotal - clientTotal) > 1) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Order total mismatch. Please refresh and try again.' }, { status: 400 });
        }

        // --- Stripe Payment Verification (C6) ---
        if (payment_method === 'card') {
            if (!stripe_payment_intent_id) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Card payment requires a payment intent.' }, { status: 400 });
            }
            // Duplicate guard inside transaction (H3 — already inside BEGIN)
            const dupCheck = await client.query(
                'SELECT id FROM orders WHERE stripe_payment_intent_id = $1',
                [stripe_payment_intent_id]
            );
            if (dupCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Order already created for this payment.', orderId: dupCheck.rows[0].id }, { status: 409 });
            }
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(stripe_payment_intent_id);
                if (paymentIntent.status !== 'succeeded') {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: 'Payment has not been confirmed. Please complete payment before placing the order.' }, { status: 402 });
                }
                // Verify the amount charged matches what the server calculated (C6)
                const expectedAmountCents = Math.round(serverTotal * 100);
                if (Math.abs(paymentIntent.amount - expectedAmountCents) > 100) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: 'Payment amount does not match order total.' }, { status: 402 });
                }
            } catch (stripeErr) {
                await client.query('ROLLBACK');
                console.error('Stripe verification error:', stripeErr);
                return NextResponse.json({ message: 'Unable to verify payment. Please try again.' }, { status: 402 });
            }
        }
        // --- End Stripe Payment Verification ---

        // --- Tabby Payment Verification ---
        if (payment_method === 'tabby') {
            if (!tabby_payment_id) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Tabby payment requires a payment ID.' }, { status: 400 });
            }
            // Duplicate guard — prevent double-orders if return page is visited twice
            const tabbyDupCheck = await client.query(
                'SELECT id FROM orders WHERE tabby_payment_id = $1',
                [tabby_payment_id]
            );
            if (tabbyDupCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: 'Order already created for this payment.', orderId: tabbyDupCheck.rows[0].id }, { status: 409 });
            }
            try {
                const tabbyPayment = await getTabbyPayment(tabby_payment_id);
                if (tabbyPayment.status !== 'authorized' && tabbyPayment.status !== 'closed') {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: `Tabby payment not authorized (status: ${tabbyPayment.status}).` }, { status: 402 });
                }
            } catch (tabbyErr) {
                await client.query('ROLLBACK');
                console.error('Tabby verification error:', tabbyErr);
                return NextResponse.json({ message: 'Unable to verify Tabby payment. Please try again.' }, { status: 402 });
            }
        }
        // --- End Tabby Payment Verification ---

        // --- Loyalty Redemption (H2 — after all validations pass) ---
        if (parsedRedeemedPoints > 0) {
            await client.query('UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2', [parsedRedeemedPoints, user_id]);
            await client.query(
                'INSERT INTO loyalty_transactions (user_id, type, points, description) VALUES ($1, $2, $3, $4)',
                [user_id, 'redeem', -parsedRedeemedPoints, 'Redeemed during Checkout']
            );
        }
        // --- End Loyalty Redemption ---

        const insertOrderSql = "INSERT INTO orders (user_address_id, payment_method, total_amount, tax_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id, discount_amount, subtotal, shipping_cost, gift_wrap, gift_wrap_cost, stripe_payment_intent_id, tabby_payment_id, redeemed_points) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id;";
        const orderValues = [
            user_address_id, payment_method,
            serverTotal, serverTax,
            'Pending', shipping_scheduled_date,
            user_id, resolvedCouponId, serverCouponDiscount,
            serverSubtotal, serverShipping,
            gift_wrap, serverGiftWrap,
            stripe_payment_intent_id, tabby_payment_id,
            parsedRedeemedPoints,
        ];
        const { rows: orderRows } = await client.query(insertOrderSql, orderValues);
        const orderId = orderRows[0].id;

        if (resolvedCouponId) {
            await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [resolvedCouponId]);
        }

        const { rows: userRows } = await client.query('SELECT email, first_name FROM users WHERE id = $1', [user_id]);
        const userEmail = userRows.length > 0 ? userRows[0].email : null;
        const firstName = userRows.length > 0 ? userRows[0].first_name : 'Customer';


        // Insert order items using server-fetched prices (C1)
        for (const item of items) {
            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [orderId, item.productId, item.quantity, dbPriceMap[item.productId]]
            );
        }

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
        
        // Fallback address structure to prevent email template errors
        const shippingAddress = addressRows.length > 0 ? {
            street: addressRows[0].shipping_address || 'Address not specified',
            city: addressRows[0].city || 'City not specified',
            zip: addressRows[0].zip_code || '',
            country: addressRows[0].country || 'United Arab Emirates',
            state: ''
        } : {
            street: 'Address not found in database',
            city: '',
            zip: '',
            country: '',
            state: ''
        };

        // Record pending loyalty transaction so the loyalty tab shows activity immediately
        const estimatedPoints = Math.floor(serverSubtotal);
        await client.query(
            'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
            [user_id, 'placed', estimatedPoints, `Order #${orderId} placed`, orderId]
        );

        await client.query('COMMIT');

        // SYNC: Update user's main phone number if they don't have one yet, using the number from the selected address
        try {
            const { rows: phoneRows } = await client.query("SELECT customer_phone FROM user_addresses WHERE id = $1", [user_address_id]);
            if (phoneRows.length > 0 && phoneRows[0].customer_phone) {
                await client.query(
                    "UPDATE users SET phone_number = $1 WHERE id = $2 AND (phone_number IS NULL OR phone_number = '')",
                    [phoneRows[0].customer_phone, user_id]
                );
            }
        } catch (syncError) {
            console.error('Non-critical sync error:', syncError);
            // We don't rollback here because the order itself was successful
        }

        // Prepare item details for customer email if needed
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
                imageUrl: product ? product.image_url : ''
            };
        });

        // Emails are non-blocking — a failure must never prevent the success response
        let emailSent = true;
        try {
            if (userEmail) {
                await sendOrderConfirmationEmail(userEmail, firstName, orderId, serverTotal, serverTax, serverCouponDiscount, serverSubtotal, serverShipping, itemsWithDetails, shippingAddress, serverGiftWrap, couponCode);
            }
        } catch (emailErr) {
            emailSent = false;
            console.error(`Customer confirmation email failed for order #${orderId}:`, emailErr);
        }
        try {
            await sendAdminNotificationEmail(null, orderId, userEmail || 'Unknown', serverTotal, shippingAddress);
        } catch (emailErr) {
            console.error(`Admin notification email failed for order #${orderId}:`, emailErr);
        }

        return NextResponse.json({ message: 'Order created successfully', orderId, emailSent }, { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return NextResponse.json({ message: 'Error creating order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}