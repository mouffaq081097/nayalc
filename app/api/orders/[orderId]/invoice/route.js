import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';
import { generateInvoiceHtml, generateInvoicePdfFor } from '../../../../../lib/mail';
import { fetchTabbyPlan } from '../../../../../lib/tabby';
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
                    o.subtotal, o.shipping_cost as "shippingCost", o.gift_wrap_cost as "giftWrapCost",
                    o.tax_amount as "taxAmount", o.discount_amount as "discountAmount",
                    o.order_status as status,
                    o.payment_method as "paymentMethod",
                    o.tabby_payment_id as "tabbyPaymentId",
                    o.created_at as "createdAt",
                    COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as "customerName",
                    COALESCE(u.email, '') as "customerEmail",
                    COALESCE(NULLIF(ua.address_line1, ''), ua.shipping_address) as "addressLine1",
                    ua.city, ua.zip_code as "postalCode", ua.country
                FROM ${source.table} o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
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

        const num = (v) => (v == null ? null : parseFloat(v) || 0);
        const details = {
            ...order,
            tabbyPlan: order.paymentMethod === 'tabby' ? await fetchTabbyPlan(order.tabbyPaymentId) : null,
            totalAmount: num(order.totalAmount) || 0,
            subtotal: num(order.subtotal),
            shippingCost: num(order.shippingCost),
            giftWrapCost: num(order.giftWrapCost),
            taxAmount: num(order.taxAmount),
            discountAmount: num(order.discountAmount),
            shippingAddress: { addressLine1: order.addressLine1, city: order.city, postalCode: order.postalCode, country: order.country },
            items: items.map(item => ({ ...item, price: parseFloat(item.price) })),
        };

        // PDF by default; ?format=html still gives the web page version
        if (new URL(request.url).searchParams.get('format') === 'html') {
            return new NextResponse(generateInvoiceHtml(details), {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Disposition': `inline; filename="invoice-${orderId}.html"`,
                },
            });
        }

        const pdf = await generateInvoicePdfFor(details);
        return new NextResponse(pdf, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="invoice-${orderId}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return NextResponse.json({ message: 'Failed to generate invoice' }, { status: 500 });
    } finally {
        client.release();
    }
}
