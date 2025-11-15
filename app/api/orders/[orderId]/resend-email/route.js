import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

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

        // Execute Python script for sending email to customer
        const pythonScriptPath = 'app/api/send_email.py';
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
                    <p>Dear ${first_name},</p>
                    <p>Thank you for your recent purchase from nayalc.com! We're excited to confirm your order.</p>
                    
                    <div class="order-summary">
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <p><strong>Total Amount:</strong> AED ${Number(total_amount).toFixed(2)}</p>
                        <p><strong>Tax Amount:</strong> AED ${Number(tax_amount).toFixed(2)}</p>
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
                            ${items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
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
        const customerCommand = `python ${pythonScriptPath} "${email}" "${customerSubject}" "${encodedCustomerBody}"`;

        exec(customerCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error (customer email): ${error}`);
                // Don't block the response for email errors
            }
            console.log(`stdout (customer email): ${stdout}`);
            console.error(`stderr (customer email): ${stderr}`);
        });

        return NextResponse.json({ message: 'Email resent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ message: 'Error resending email', error: error.message }, { status: 500 });
    }
}
