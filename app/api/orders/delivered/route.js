import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Helper function to fetch delivered order items for a given order ID
const fetchDeliveredOrderItems = async (orderId, client) => {
    const sql = `
        SELECT 
            oi.product_id as "productId", 
            oi.quantity, 
            oi.price,
            p.name,
            b.name as "brandName",
            pi.image_url as "imageUrl"
        FROM delivered_order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE oi.order_id = $1;
    `;
    const { rows } = await client.query(sql, [orderId]);
    return rows.map(item => ({ ...item, price: parseFloat(item.price) }));
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        let baseSql = `
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
                o.delivered_at as "deliveredAt"
            FROM delivered_orders o
            JOIN user_addresses ua ON o.user_address_id = ua.id
        `;
        
        let countSql = `SELECT COUNT(*) FROM delivered_orders o JOIN user_addresses ua ON o.user_address_id = ua.id`;
        const params = [];
        const countParams = [];

        const totalCountResult = await client.query(countSql, countParams);
        const totalCount = parseInt(totalCountResult.rows[0].count, 10);

        let paginatedSql = baseSql + ` ORDER BY o.delivered_at DESC LIMIT $1 OFFSET $2;`;
        params.push(limit);
        params.push(offset);

        const { rows: orders } = await client.query(paginatedSql, params);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await fetchDeliveredOrderItems(order.id, client);
            return { ...order, items };
        }));

        return NextResponse.json({
            orders: ordersWithItems,
            totalCount,
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching delivered orders:', error);
        return NextResponse.json({ message: 'Error fetching delivered orders from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
