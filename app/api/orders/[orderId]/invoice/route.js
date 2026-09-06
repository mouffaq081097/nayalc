import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { generateInvoiceHtml } from '../../../../../lib/mail';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mouffaq@nayalc.com';

const ORDER_SOURCES = [
    { table: 'orders', itemsTable: 'order_items', itemsFk: 'order_id' },
    { table: 'delivered_orders', itemsTable: 'delivered_order_items', itemsFk: 'order_id' },
    { table: 'cancelled_orders', itemsTable: 'cancelled_order_items', itemsFk: 'order_id' },
];

export async function GET(request, context) {
    const { orderId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = session.user.email === ADMIN_EMAIL;

    const client = await db.connect();
    try {
        let order = null;
        let items = [];

        for (const source of ORDER_SOURCES) {
            const { rows } = await client.query(`
                SELECT
                    o.id,
                    o.user_id as "userId",
                    o.total_amount::numeric as "totalAmount",
                    o.payment_method as "paymentMethod",
                    o.created_at as "createdAt",
                    COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as "customerName",
                    COALESCE(u.email, '') as "customerEmail"
                FROM ${source.table} o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = $1
            `, [orderId]);

            if (rows.length > 0) {
                order = rows[0];
                const itemsResult = await client.query(`
                    SELECT oi.quantity, oi.price, p.name
                    FROM ${source.itemsTable} oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.${source.itemsFk} = $1
                `, [orderId]);
                items = itemsResult.rows;
                break;
            }
        }

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        if (!isAdmin && String(order.userId) !== String(session.user.id)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const invoiceHtml = generateInvoiceHtml({
            ...order,
            totalAmount: parseFloat(order.totalAmount) || 0,
            items: items.map(item => ({ ...item, price: parseFloat(item.price) })),
        });

        return new NextResponse(invoiceHtml, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; filename="invoice-${orderId}.html"`,
            },
        });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return NextResponse.json({ message: 'Failed to generate invoice' }, { status: 500 });
    } finally {
        client.release();
    }
}
