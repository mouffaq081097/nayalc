import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { sendOrderStatusUpdateEmail } from '../../../../lib/mail';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request, context) {
    const { orderId } = await context.params;
    const client = await db.connect();
    try {
        let orderResult;
        let items = [];

        // Try to find in orders table
        orderResult = await client.query(`
            SELECT 
                o.*, 
                o.order_status as status, 
                o.total_amount as "totalAmount", 
                o.created_at as "createdAt",
                o.tax_amount as "taxAmount",
                o.discount_amount as "discountAmount",
                o.shipping_cost as "shippingCost",
                o.gift_wrap_cost as "giftWrapCost",
                o.stripe_payment_intent_id as "stripePaymentIntentId",
                u.first_name || ' ' || u.last_name as "customerName",
                u.email as "customerEmail",
                ua.customer_phone as "customerPhone",
                ua.address_line1 as "shippingAddress",
                ua.address_line2 as "addressLine2",
                ua.city,
                ua.state,
                ua.country,
                ua.zip_code as "zipCode"
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN user_addresses ua ON o.user_address_id = ua.id
            WHERE o.id = $1
        `, [orderId]);

        if (orderResult.rows.length > 0) {
            const itemsResult = await client.query(`
                SELECT oi.id, oi.quantity, oi.price, p.id as "productId", p.name, pi.image_url as "imageUrl"
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                WHERE oi.order_id = $1
            `, [orderId]);
            items = itemsResult.rows;
        } else {
            // Try to find in delivered_orders table
            orderResult = await client.query(`
                SELECT 
                    o.*, 
                    o.order_status as status, 
                    o.total_amount as "totalAmount", 
                    o.created_at as "createdAt",
                    o.tax_amount as "taxAmount",
                    o.discount_amount as "discountAmount",
                    o.shipping_cost as "shippingCost",
                    o.shipping_cost as "shippingCost",
                    o.gift_wrap_cost as "giftWrapCost",
                    o.stripe_payment_intent_id as "stripePaymentIntentId",
                    u.first_name || ' ' || u.last_name as "customerName",
                    u.email as "customerEmail",
                    ua.customer_phone as "customerPhone",
                    ua.address_line1 as "shippingAddress",
                    ua.address_line2 as "addressLine2",
                    ua.city,
                    ua.state,
                    ua.country,
                    ua.zip_code as "zipCode"
                FROM delivered_orders o
                JOIN users u ON o.user_id = u.id
                JOIN user_addresses ua ON o.user_address_id = ua.id
                WHERE o.id = $1
            `, [orderId]);

            if (orderResult.rows.length > 0) {
                const itemsResult = await client.query(`
                    SELECT doi.id, doi.quantity, doi.price, p.id as "productId", p.name, pi.image_url as "imageUrl"
                    FROM delivered_order_items doi
                    JOIN products p ON doi.product_id = p.id
                    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                    WHERE doi.order_id = $1
                `, [orderId]);
                items = itemsResult.rows;
            } else {
                // Try to find in cancelled_orders table
                orderResult = await client.query(`
                    SELECT 
                        o.*, 
                        o.order_status as status, 
                        o.total_amount as "totalAmount", 
                        o.created_at as "createdAt",
                        o.cancellation_reason as "cancellationReason",
                        o.tax_amount as "taxAmount",
                        o.discount_amount as "discountAmount",
                        o.shipping_cost as "shippingCost",
                        o.shipping_cost as "shippingCost",
                        o.gift_wrap_cost as "giftWrapCost",
                        o.stripe_payment_intent_id as "stripePaymentIntentId",
                        u.first_name || ' ' || u.last_name as "customerName",
                        u.email as "customerEmail",
                        ua.customer_phone as "customerPhone",
                        ua.address_line1 as "shippingAddress",
                        ua.address_line2 as "addressLine2",
                        ua.city,
                        ua.state,
                        ua.country,
                        ua.zip_code as "zipCode"
                    FROM cancelled_orders o
                    JOIN users u ON o.user_id = u.id
                    JOIN user_addresses ua ON o.user_address_id = ua.id
                    WHERE o.id = $1
                `, [orderId]);
                if (orderResult.rows.length > 0) {
                    const itemsResult = await client.query(`
                        SELECT coi.id, coi.quantity, coi.price, p.id as "productId", p.name, pi.image_url as "imageUrl"
                        FROM cancelled_order_items coi
                        JOIN products p ON coi.product_id = p.id
                        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
                        WHERE coi.order_id = $1
                    `, [orderId]);
                    items = itemsResult.rows;
                }
            }
        }

        if (orderResult.rows.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const order = orderResult.rows[0];

        // Common processing for the found order
        order.totalAmount = parseFloat(order.totalAmount);
        order.taxAmount = parseFloat(order.taxAmount);
        order.discountAmount = parseFloat(order.discountAmount);
        order.shippingCost = parseFloat(order.shippingCost);
        order.giftWrapCost = parseFloat(order.giftWrapCost);
        order.subtotal = parseFloat(order.subtotal); // Ensure subtotal is parsed

        // If payment method is card, fetch Stripe details for display
        if (order.paymentMethod === 'card' && order.stripePaymentIntentId) {
            try {
                const charges = await stripe.charges.list({
                    payment_intent: order.stripePaymentIntentId,
                    limit: 1, // Assuming only one charge per payment intent for simplicity
                });

                if (charges.data.length > 0) {
                    const charge = charges.data[0];
                    order.cardDetails = {
                        brand: charge.payment_method_details?.card?.brand,
                        last4: charge.payment_method_details?.card?.last4,
                        funding: charge.payment_method_details?.card?.funding,
                        network: charge.payment_method_details?.card?.network,
                        status: charge.status,
                    };
                }
            } catch (stripeError) {
                console.error('Error fetching Stripe PaymentIntent for user view:', stripeError);
                // Continue without card details if Stripe fetch fails
            }
        }

        // Structure the address details as expected across the app
        order.shippingAddressDetails = {
            addressLine1: order.shippingAddress,
            addressLine2: order.addressLine2,
            city: order.city,
            state: order.state,
            postalCode: order.zipCode,
            country: order.country
        };

        order.items = items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price),
            product: {
                id: item.productId,
                name: item.name,
                imageUrl: item.imageUrl
            }
        }));

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json({ message: 'Error fetching order details from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(request, context) {
    const { orderId } = await context.params;
    const client = await db.connect();

    try {
        const { status, cancellationReason, trackingNumber, shippingCompany, shippingLink } = await request.json();

        if (!status) {
            return NextResponse.json({ message: 'Status is required' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Fetch current order details before potential move or update, including fields for email
        const currentOrderResult = await client.query(
            `SELECT 
                o.id, o.user_address_id, o.payment_method, o.total_amount, o.tax_amount, o.discount_amount,
                o.order_status, o.shipping_scheduled_date, o.payment_confirmed, o.user_id, o.applied_coupon_id,
                o.tracking_number, o.shipping_company, o.shipping_link, o.created_at, o.updated_at,
                o.subtotal, o.shipping_cost, o.stripe_payment_intent_id, o.gift_wrap, o.gift_wrap_cost,
                ua.customer_email, ua.customer_phone, ua.shipping_address, ua.city, ua.zip_code, ua.country,
                u.first_name
            FROM orders o
            JOIN user_addresses ua ON o.user_address_id = ua.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1`,
            [orderId]
        );

        if (currentOrderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
        const currentOrder = currentOrderResult.rows[0];

        // Prepare order details for email (parse numbers and structure address)
        currentOrder.totalAmount = parseFloat(currentOrder.total_amount);
        currentOrder.taxAmount = parseFloat(currentOrder.tax_amount);
        currentOrder.discountAmount = parseFloat(currentOrder.discount_amount);
        currentOrder.subtotal = parseFloat(currentOrder.subtotal);
        currentOrder.shippingCost = parseFloat(currentOrder.shipping_cost);
        currentOrder.shippingAddressDetails = {
            addressLine1: currentOrder.shipping_address,
            city: currentOrder.city,
            postalCode: currentOrder.zip_code,
            country: currentOrder.country
        };

        // Fetch order items with product details for email
        const orderItemsResult = await client.query(
            `SELECT
                oi.id, oi.quantity, oi.price,
                p.id as "productId", p.name, pi.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE oi.order_id = $1`,
            [orderId]
        );
        currentOrder.items = orderItemsResult.rows.map(item => ({
            ...item,
            price: parseFloat(item.price)
        }));

        // --- Handle Status Transitions ---
        if (status === 'Delivered') {
            const deliveredOrderSql = "INSERT INTO delivered_orders (\n" +
                "    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,\n" +
                "    order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id,\n" +
                "    tracking_number, courier_name, courier_website, created_at, updated_at, delivered_at,\n" +
                "    subtotal, shipping_cost, stripe_payment_intent_id, gift_wrap, gift_wrap_cost\n" +
                ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, $18, $19, $20, $21)";

            const deliveredOrderValues = [
                currentOrder.id,
                currentOrder.user_address_id,
                currentOrder.payment_method,
                currentOrder.total_amount,
                currentOrder.tax_amount,
                currentOrder.discount_amount,
                status, // new status
                currentOrder.shipping_scheduled_date,
                currentOrder.payment_confirmed,
                currentOrder.user_id,
                currentOrder.applied_coupon_id,
                trackingNumber || currentOrder.tracking_number,
                shippingCompany || currentOrder.shipping_company,
                shippingLink || currentOrder.shipping_link,
                currentOrder.created_at,
                currentOrder.updated_at,
                currentOrder.subtotal,
                currentOrder.shippingCost,
                currentOrder.stripe_payment_intent_id,
                currentOrder.gift_wrap,
                currentOrder.gift_wrap_cost
            ];
            await client.query(deliveredOrderSql, deliveredOrderValues);

            // Move order items and update inventory
            for (const item of currentOrder.items) {
                const insertDeliveredItemSql = "INSERT INTO delivered_order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)";
                await client.query(
                    insertDeliveredItemSql,
                    [currentOrder.id, item.productId, item.quantity, item.price]
                );
                // Update product inventory
                await client.query(
                    `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
                    [item.quantity, item.productId]
                );
            }

            await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        } else if (status === 'Cancelled') {
            const cancelledOrderSql = "INSERT INTO cancelled_orders (\n" +
                "    id, user_address_id, payment_method, total_amount, tax_amount, discount_amount,\n" +
                "    order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id,\n" +
                "    tracking_number, courier_name, courier_website, created_at, updated_at, cancelled_at, cancellation_reason, stripe_payment_intent_id, gift_wrap, gift_wrap_cost\n" +
                ") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, $18, $19, $20);";
            const cancelledOrderValues = [
                currentOrder.id,
                currentOrder.user_address_id,
                currentOrder.payment_method,
                currentOrder.total_amount,
                currentOrder.tax_amount,
                currentOrder.discount_amount,
                status, // new status
                currentOrder.shipping_scheduled_date,
                currentOrder.payment_confirmed,
                currentOrder.user_id,
                currentOrder.applied_coupon_id,
                trackingNumber || currentOrder.tracking_number,
                shippingCompany || currentOrder.shipping_company,
                shippingLink || currentOrder.shipping_link,
                currentOrder.created_at,
                currentOrder.updated_at,
                cancellationReason,
                currentOrder.stripe_payment_intent_id,
                currentOrder.gift_wrap,
                currentOrder.gift_wrap_cost,
            ];
            await client.query(cancelledOrderSql, cancelledOrderValues);

            // Move order items
            for (const item of currentOrder.items) {
                const insertSql = "INSERT INTO cancelled_order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)";
                await client.query(
                    insertSql,
                    [currentOrder.id, item.productId, item.quantity, item.price]
                );
            }
            await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

        } else {
            // Update status and tracking info in the 'orders' table
            const updateOrderSql = "UPDATE orders\n" +
                "SET \n" +
                "    order_status = $1,\n" +
                "    tracking_number = $2,\n" +
                "    shipping_company = $3,\n" +
                "    shipping_link = $4,\n" +
                "    cancellation_reason = $5,\n" +
                "    updated_at = NOW()\n" +
                "WHERE id = $6";

            const updateOrderValues = [
                status,
                trackingNumber,
                shippingCompany,
                shippingLink,
                cancellationReason,
                orderId,
            ];
            await client.query(updateOrderSql, updateOrderValues);
        }

        // Send email notification after successful status update/move
        await sendOrderStatusUpdateEmail(
            currentOrder.customer_email,
            currentOrder.first_name,
            currentOrder.id,
            status, // newStatus
            cancellationReason, // new parameter
            currentOrder.totalAmount, // Use parsed float
            currentOrder.taxAmount,   // Use parsed float
            currentOrder.discountAmount, // Use parsed float
            currentOrder.subtotal,
            currentOrder.shippingCost,
            currentOrder.items.map(item => ({ // Ensure item prices are floats
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                imageUrl: item.image_url // Use image_url from fetched items
            })),
            currentOrder.shippingAddressDetails,
            trackingNumber || currentOrder.tracking_number,
            shippingCompany || currentOrder.shipping_company,
            shippingLink || currentOrder.shipping_link,
            { // Simplified orderDetails for invoice generation
                id: currentOrder.id,
                createdAt: currentOrder.created_at,
                paymentMethod: currentOrder.payment_method,
                customerName: currentOrder.first_name,
                customerEmail: currentOrder.customer_email,
                customerPhone: currentOrder.customer_phone,
                shippingAddress: currentOrder.shippingAddressDetails,
                subtotal: currentOrder.subtotal,
                discountAmount: currentOrder.discountAmount,
                taxAmount: currentOrder.taxAmount,
                shippingCost: currentOrder.shippingCost,
                totalAmount: currentOrder.totalAmount,
                items: currentOrder.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
            }
        );

        await client.query('COMMIT');
        // Determine response based on whether the order was moved or just updated
        const responseData = (status === 'Delivered' || status === 'Cancelled')
            ? { message: "Order " + orderId + " updated to " + status + " and moved", moved: true }
            : { message: "Order " + orderId + " updated to " + status, moved: false };

        return NextResponse.json(responseData);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating order:', error);
        return NextResponse.json({ message: 'Error updating order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}