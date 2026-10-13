import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { currentSessionUser } from '@/lib/adminAuth';
import { placeOrder } from '@/lib/placeOrder';
import { ensureBackorderColumns } from '@/lib/backorders';

// Helper function to fetch order items for a given order ID and item table name
const fetchOrderItems = async (orderId, itemTableName, client) => {
    const sql = `
        SELECT
            oi.product_id as "productId",
            oi.quantity,
            oi.price,
            ${itemTableName === 'order_items' ? 'oi.backordered_qty' : '0'} as "backorderedQty",
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
        ${tableName === 'orders' ? 'o.awaiting_stock' : 'false'} as "awaitingStock",
        ${tableName === 'orders' ? 'o.promised_ship_by::text' : 'NULL::text'} as "promisedShipBy",
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

    // Customers may only list their own orders; everyone's orders (or another customer's) are admin-only
    const sessionUser = await currentSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (sessionUser.role !== 'admin' && (!userId || String(userId) !== String(sessionUser.id))) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const statusFilter = searchParams.get('statusFilter') || 'pending'; // 'all', 'pending', 'delivered', 'cancelled'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    await ensureBackorderColumns();
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

        // userId (when present) is always bound as $1 — reused verbatim across every
        // UNION branch, since it's the same value in each. Only LIMIT/OFFSET get their
        // own placeholders, appended after it.
        const userIdWhere = userId ? ` o.user_id = $1` : '';

        for (const config of orderTableConfig) {
            let whereClause = userIdWhere ? ` WHERE${userIdWhere}` : '';

            // Add specific status filter if not 'all'
            if (statusFilter !== 'all') {
                 whereClause += (whereClause ? ' AND' : ' WHERE') + ` o.order_status = '${config.statusValue}'`;
            }

            combinedSql.push(selectOrderFields(config.name) + whereClause);
            combinedCountSql.push(`SELECT COUNT(*) FROM ${config.name} o LEFT JOIN user_addresses ua ON o.user_address_id = ua.id` + whereClause);
        }

        // Handle case where no tables are selected due to statusFilter
        if (combinedSql.length === 0) {
            return NextResponse.json({ orders: [], totalCount: 0, page, limit });
        }

        const countParams = userId ? [userId] : [];
        const fullCountQuery = combinedCountSql.join(' UNION ALL ');

        // Execute the count query with its specific parameters
        const totalCountResult = await client.query(fullCountQuery, countParams);
        const totalCount = totalCountResult.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

        // Prepare parameters for the full SELECT query — userId (if any) as $1, then limit/offset
        const fullSelectQueryParams = userId ? [userId, limit, offset] : [limit, offset];
        const limitPlaceholder = userId ? 2 : 1;
        const offsetPlaceholder = userId ? 3 : 2;
        const fullQuery = combinedSql.join(' UNION ALL ') + ` ORDER BY "createdAt" DESC LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder};`;

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
export async function POST(request) {
    const { status, body } = await placeOrder(await request.json());
    return NextResponse.json(body, { status });
}
