import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/mail'; // Import the new function

export async function POST(request, { params }) {
    const orderId = params.orderId;

    try {
        const client = await db.connect();
        // Fetch order details
        const orderSql = `
            SELECT
                o.id,
                o.total_amount,
                o.tax_amount,
                u.email,
                u.first_name,
                ua.shipping_address,
                ua.city,
                ua.zip_code,
                ua.country
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN user_addresses ua ON o.user_address_id = ua.id
            WHERE o.id = $1;
        `;
        const { rows: orderRows } = await client.query(orderSql, [orderId]);

        if (orderRows.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const order = orderRows[0];

        // Fetch order items
        const itemsSql = `
            SELECT 
                oi.quantity, 
                oi.price,
                p.name,
                pi.image_url as "imageUrl"
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE oi.order_id = $1;
        `;
        const { rows: items } = await client.query(itemsSql, [orderId]);

        client.release();

        const { email, first_name, total_amount, tax_amount, shipping_address, city, zip_code, country } = order;
        
        const shippingAddress = {
            street: shipping_address,
            city,
            zip: zip_code,
            country,
        };

        // Send order confirmation email to customer using Nodemailer
        await sendOrderConfirmationEmail(email, first_name, orderId, total_amount, tax_amount, items, shippingAddress);

        return NextResponse.json({ message: 'Email resent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ message: 'Error resending email', error: error.message }, { status: 500 });
    }
}
