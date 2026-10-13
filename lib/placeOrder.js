import db from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail';
import Stripe from 'stripe';
import { getTabbyPayment, isTabbyPaid } from '@/lib/tabby';
import { calcShipping, getPreorderInfo } from '@/lib/shipping';
import { pointsForOrder, pointsToAed } from '@/lib/loyalty';
import { vatFromGross } from '@/lib/vat';
import { calcCouponDiscount } from '@/lib/couponDiscount';
import { ensureCouponProductsColumn } from '@/lib/couponRules';
import { ensureBackorderColumns } from '@/lib/backorders';
import { COD_PREORDER_MESSAGE } from '@/lib/backorderRules';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Creates an order after checking stock, prices, the discount, loyalty points and the payment.
// Used by checkout (POST /api/orders) and by the Tabby return page and webhook.
// Returns { status, body } — status 201 on success, 409 if this payment already has an order.
const GIFT_WRAP_FEE = 100; // AED — authoritative server constant

// "Pre-order · ships by Tue 27 Oct" under an email line, or '' when it ships now
const preorderNote = (short, quantity, preorder) => short > 0
    ? `${short === quantity ? 'Pre-order' : `${short} of ${quantity} on pre-order`} · ships by ${preorder.shipByLabel}`
    : '';

export async function placeOrder(payload) {

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
        } = payload;

        if (!user_address_id || !payment_method || !total_amount || !user_id || !Array.isArray(items) || items.length === 0) {
            return { status: 400, body: { message: 'Missing required order information or items.' } };
        }

        // Validate quantities are positive integers (L7)
        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return { status: 400, body: { message: `Invalid quantity for product ${item.productId}.` } };
            }
        }

        if (applied_coupon_id) await ensureCouponProductsColumn(db);
        await ensureBackorderColumns();

        await client.query('BEGIN');

        // The Tabby return page and Tabby's webhook can both try to create the same
        // order at once — serialize them so the duplicate check below sees the winner
        if (payment_method === 'tabby' && tabby_payment_id) {
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`tabby:${tabby_payment_id}`]);
        }

        // --- Address Ownership Check (H4) ---
        const { rows: addrRows } = await client.query(
            'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
            [user_address_id, user_id]
        );
        if (addrRows.length === 0) {
            await client.query('ROLLBACK');
            return { status: 400, body: { message: 'Invalid shipping address.' } };
        }

        // --- Stock Validation + Real Price Fetch (C1, C3, L6) ---
        // SELECT FOR UPDATE acquires row locks, preventing concurrent oversell.
        // Locked lowest id first, the same order as allocateStock(), so they never deadlock.
        const dbPriceMap = {};
        // Per product: units taken from the shelf now, and units pre-ordered (lib/backorders.js)
        const stockPlan = {};
        let preorderLeadDays = 0;
        for (const item of [...items].sort((a, b) => a.productId - b.productId)) {
            const { rows: productRows } = await client.query(
                `SELECT p.name, p.stock_quantity, p.price, p.is_active, p.allow_backorder, p.backorder_lead_days, p.backorder_limit,
                        COALESCE((SELECT SUM(oi.backordered_qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS owed
                 FROM products p WHERE p.id = $1 FOR UPDATE`,
                [item.productId]
            );

            if (productRows.length === 0) {
                await client.query('ROLLBACK');
                return { status: 400, body: { message: `Product with ID ${item.productId} not found.` } };
            }

            const product = productRows[0];

            if (product.is_active === false) {
                await client.query('ROLLBACK');
                return { status: 400, body: { message: `Product ${item.productId} is no longer available.` } };
            }

            // Whatever the shelf can't cover is a pre-order, if the product takes them
            const shelf = Math.max(0, Number(product.stock_quantity) || 0);
            const short = Math.max(0, item.quantity - shelf);
            if (short > 0) {
                const room = product.allow_backorder ? Math.max(0, product.backorder_limit - product.owed) : 0;
                if (short > room) {
                    await client.query('ROLLBACK');
                    const canBuy = shelf + room;
                    return { status: 400, body: { message: canBuy > 0
                        ? `Only ${canBuy} of "${product.name}" can be ordered right now. Please lower the quantity.`
                        : `"${product.name}" is out of stock.` } };
                }
                if (payment_method === 'cashOnDelivery') {
                    await client.query('ROLLBACK');
                    return { status: 400, body: { message: COD_PREORDER_MESSAGE } };
                }
                preorderLeadDays = Math.max(preorderLeadDays, Number(product.backorder_lead_days) || 1);
            }
            stockPlan[item.productId] = { fromShelf: item.quantity - short, short };

            dbPriceMap[item.productId] = parseFloat(product.price);
        }
        const preorder = preorderLeadDays > 0 ? getPreorderInfo(preorderLeadDays) : null;
        // --- End Stock Validation ---

        // --- Server-Side Total Calculation (C2) ---
        const serverSubtotal = items.reduce((sum, item) => sum + dbPriceMap[item.productId] * item.quantity, 0);
        // Quantity-based tiers from lib/shipping.js — the single source of truth.
        // This MUST match what the cart and checkout showed the customer, or the
        // total check below rejects the order after the card has been charged.
        const serverQty = items.reduce((sum, item) => sum + item.quantity, 0);
        const serverShipping = calcShipping(serverQty);
        const serverGiftWrap = gift_wrap ? GIFT_WRAP_FEE : 0;

        // --- Coupon Revalidation (H1) ---
        let serverCouponDiscount = 0;
        let couponCode = null;
        let resolvedCouponId = null;
        if (applied_coupon_id) {
            const { rows: couponRows } = await client.query(
                'SELECT id, code, is_active, expiration_date, usage_limit, usage_count, minimum_purchase_amount, discount_type, discount_value, product_ids FROM coupons WHERE id = $1',
                [applied_coupon_id]
            );
            if (couponRows.length > 0) {
                const coupon = couponRows[0];
                const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                const isOverLimit = coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit;
                // Same calculation as the cart: honours the minimum and, for a
                // product-specific code, only discounts those products' lines
                const discount = calcCouponDiscount(coupon, items.map(item => ({
                    productId: item.productId, price: dbPriceMap[item.productId], quantity: item.quantity,
                })));
                if (coupon.is_active && !isExpired && !isOverLimit && discount > 0) {
                    serverCouponDiscount = discount;
                    couponCode = coupon.code;
                    resolvedCouponId = coupon.id;
                }
                // If coupon is invalid at order time, proceed without discount
            }
        }

        // --- Loyalty Points Validation (H2) ---
        const parsedRedeemedPoints = parseInt(redeemed_points, 10) || 0;
        const serverPointsDiscount = pointsToAed(parsedRedeemedPoints);

        // A coupon and a points redemption are mutually exclusive — one order
        // carries one discount. Checkout enforces this too; this is the
        // authoritative backstop, and it runs before any payment is captured.
        if (serverCouponDiscount > 0 && parsedRedeemedPoints > 0) {
            await client.query('ROLLBACK');
            return { status: 400, body: { message: 'Use either a promo code or loyalty points on an order, not both.' } };
        }

        if (parsedRedeemedPoints > 0) {
            // Lock user row to prevent parallel redemptions
            const userLoyaltyRes = await client.query(
                'SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE',
                [user_id]
            );
            if (!userLoyaltyRes.rows[0] || userLoyaltyRes.rows[0].loyalty_points < parsedRedeemedPoints) {
                await client.query('ROLLBACK');
                return { status: 400, body: { message: 'Insufficient loyalty points.' } };
            }
        }

        // --- Server Total Verification (C2) ---
        // Prices are VAT-inclusive, so VAT is never added here — it is extracted
        // from the total below, purely for the tax record and the tax invoice.
        const serverTotal = Math.max(0, serverSubtotal + serverShipping + serverGiftWrap - serverCouponDiscount - serverPointsDiscount);
        const serverTax = vatFromGross(serverTotal);
        const clientTotal = parseFloat(total_amount);
        if (Math.abs(serverTotal - clientTotal) > 1) {
            await client.query('ROLLBACK');
            return { status: 400, body: { message: 'Order total mismatch. Please refresh and try again.' } };
        }

        // --- Stripe Payment Verification (C6) ---
        if (payment_method === 'card') {
            if (!stripe_payment_intent_id) {
                await client.query('ROLLBACK');
                return { status: 400, body: { message: 'Card payment requires a payment intent.' } };
            }
            // Duplicate guard inside transaction (H3 — already inside BEGIN)
            const dupCheck = await client.query(
                'SELECT id FROM orders WHERE stripe_payment_intent_id = $1',
                [stripe_payment_intent_id]
            );
            if (dupCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return { status: 409, body: { message: 'Order already created for this payment.', orderId: dupCheck.rows[0].id } };
            }
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(stripe_payment_intent_id);
                if (paymentIntent.status !== 'succeeded') {
                    await client.query('ROLLBACK');
                    return { status: 402, body: { message: 'Payment has not been confirmed. Please complete payment before placing the order.' } };
                }
                // Verify the amount charged matches what the server calculated (C6)
                const expectedAmountCents = Math.round(serverTotal * 100);
                if (Math.abs(paymentIntent.amount - expectedAmountCents) > 100) {
                    await client.query('ROLLBACK');
                    return { status: 402, body: { message: 'Payment amount does not match order total.' } };
                }
            } catch (stripeErr) {
                await client.query('ROLLBACK');
                console.error('Stripe verification error:', stripeErr);
                return { status: 402, body: { message: 'Unable to verify payment. Please try again.' } };
            }
        }
        // --- End Stripe Payment Verification ---

        // --- Tabby Payment Verification ---
        if (payment_method === 'tabby') {
            if (!tabby_payment_id) {
                await client.query('ROLLBACK');
                return { status: 400, body: { message: 'Tabby payment requires a payment ID.' } };
            }
            // Duplicate guard — prevent double-orders if return page is visited twice
            const tabbyDupCheck = await client.query(
                'SELECT id FROM orders WHERE tabby_payment_id = $1',
                [tabby_payment_id]
            );
            if (tabbyDupCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return { status: 409, body: { message: 'Order already created for this payment.', orderId: tabbyDupCheck.rows[0].id } };
            }
            try {
                const tabbyPayment = await getTabbyPayment(tabby_payment_id);
                if (!isTabbyPaid(tabbyPayment.status)) {
                    await client.query('ROLLBACK');
                    return { status: 402, body: { message: `Tabby payment not authorized (status: ${tabbyPayment.status}).` } };
                }
                // The amount is chosen in the browser when the Tabby session starts, so check it was the real total
                if (Math.abs(parseFloat(tabbyPayment.amount) - serverTotal) > 1) {
                    await client.query('ROLLBACK');
                    return { status: 402, body: { message: `Tabby payment amount (AED ${tabbyPayment.amount}) does not match the order total (AED ${serverTotal.toFixed(2)}).` } };
                }
            } catch (tabbyErr) {
                await client.query('ROLLBACK');
                console.error('Tabby verification error:', tabbyErr);
                return { status: 402, body: { message: 'Unable to verify Tabby payment. Please try again.' } };
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

        const insertOrderSql = "INSERT INTO orders (user_address_id, payment_method, total_amount, tax_amount, order_status, shipping_scheduled_date, payment_confirmed, user_id, applied_coupon_id, discount_amount, subtotal, shipping_cost, gift_wrap, gift_wrap_cost, stripe_payment_intent_id, tabby_payment_id, redeemed_points, awaiting_stock, promised_ship_by) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id;";
        const orderValues = [
            user_address_id, payment_method,
            serverTotal, serverTax,
            'Pending', shipping_scheduled_date,
            user_id, resolvedCouponId, serverCouponDiscount,
            serverSubtotal, serverShipping,
            gift_wrap, serverGiftWrap,
            stripe_payment_intent_id, tabby_payment_id,
            parsedRedeemedPoints,
            !!preorder, preorder ? preorder.shipByISO : null,
        ];
        const { rows: orderRows } = await client.query(insertOrderSql, orderValues);
        const orderId = orderRows[0].id;

        if (resolvedCouponId) {
            await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [resolvedCouponId]);
        }

        const { rows: userRows } = await client.query('SELECT email, first_name, loyalty_tier FROM users WHERE id = $1', [user_id]);
        const userEmail = userRows.length > 0 ? userRows[0].email : null;
        const firstName = userRows.length > 0 ? userRows[0].first_name : 'Customer';
        const userTier = userRows.length > 0 ? userRows[0].loyalty_tier : 'Silver';


        // Insert order items using server-fetched prices (C1); pre-ordered units are recorded as owed
        for (const item of items) {
            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price, backordered_qty) VALUES ($1, $2, $3, $4, $5)",
                [orderId, item.productId, item.quantity, dbPriceMap[item.productId], stockPlan[item.productId].short]
            );
        }

        // Deduct inventory for each item — only what came off the shelf
        for (const item of items) {
            await client.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [stockPlan[item.productId].fromShelf, item.productId]
            );
        }

        // Fetch shipping address details
        const { rows: addressRows } = await client.query(
            "SELECT shipping_address, city, zip_code, country, customer_phone FROM user_addresses WHERE id = $1",
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
        const customerPhone = addressRows.length > 0 ? addressRows[0].customer_phone : null;

        // Record a pending loyalty transaction so the loyalty tab shows activity immediately.
        // Points are NOT credited here — they are only added to the balance when the order is
        // marked Delivered (see app/api/orders/[orderId]/route.js). Stored with type 'pending'
        // so the UI renders it as pending rather than as already-earned points.
        const estimatedPoints = pointsForOrder(serverSubtotal, userTier);
        await client.query(
            'INSERT INTO loyalty_transactions (user_id, type, points, description, order_id) VALUES ($1, $2, $3, $4, $5)',
            [user_id, 'pending', estimatedPoints, `Order #${orderId} placed — points credited on delivery`, orderId]
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
                price: dbPriceMap[item.productId],
                name: product ? product.name : 'Unknown Product',
                imageUrl: product ? product.image_url : '',
                note: preorderNote(stockPlan[item.productId].short, item.quantity, preorder),
            };
        });

        // Emails are non-blocking — a failure must never prevent the success response
        const placedAt = new Date();
        let emailSent = true;
        try {
            if (userEmail) {
                await sendOrderConfirmationEmail(userEmail, firstName, orderId, serverTotal, serverTax, serverCouponDiscount, serverSubtotal, serverShipping, itemsWithDetails, shippingAddress, serverGiftWrap, couponCode, payment_method, placedAt, preorder?.shipByLabel || null, tabby_payment_id);
            }
        } catch (emailErr) {
            emailSent = false;
            console.error(`Customer confirmation email failed for order #${orderId}:`, emailErr);
        }
        try {
            await sendAdminNotificationEmail(null, orderId, userEmail || 'Unknown', serverTotal, shippingAddress, {
                customerName: firstName,
                customerPhone,
                paymentMethod: payment_method,
                items: itemsWithDetails,
                subtotal: serverSubtotal,
                shippingCost: serverShipping,
                taxAmount: serverTax,
                discountAmount: serverCouponDiscount,
                giftWrapCost: serverGiftWrap,
                couponCode,
                placedAt,
                preorderShipBy: preorder?.shipByLabel || null,
                tabbyPaymentId: tabby_payment_id,
            });
        } catch (emailErr) {
            console.error(`Admin notification email failed for order #${orderId}:`, emailErr);
        }

        return { status: 201, body: { message: 'Order created successfully', orderId, emailSent } };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return { status: 500, body: { message: 'Error creating order', error: error.message } };
    } finally {
        client.release();
    }
}