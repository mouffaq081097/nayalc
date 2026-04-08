import nodemailer from 'nodemailer';

const LOGO_URL = 'https://nayalc.com/favicon.jpeg';
const BRAND_PINK = '#9333ea';
const BRAND_BLUE = '#db2777';
const BRAND_DARK = '#111111';

const formatShippingCost = (cost) => {
    if (!cost || isNaN(cost) || Number(cost) === 0) {
        return 'Free';
    }
    return `AED ${Number(cost).toFixed(2)}`;
};

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Global Email Wrapper Template
 */
const emailWrapper = (content, title) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: ${BRAND_DARK}; background-color: #FAF9F6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
        .header { background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f5f5f7; }
        .logo { width: 60px; height: 60px; border-radius: 15px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.2em; color: ${BRAND_DARK}; }
        .content { padding: 40px; }
        .content h2 { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: ${BRAND_DARK}; }
        .content p { font-size: 15px; color: #666; margin-bottom: 15px; }
        .button { display: inline-block; background-color: ${BRAND_DARK}; color: #ffffff !important; padding: 18px 36px; text-decoration: none; border-radius: 50px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; margin-top: 25px; transition: all 0.3s ease; }
        .footer { text-align: center; font-size: 11px; color: #999; padding: 40px 20px; background-color: #FAF9F6; border-top: 1px solid #f0f0f0; }
        .footer a { color: ${BRAND_PINK}; text-decoration: none; font-weight: 700; }
        .accent-bar { height: 4px; background: linear-gradient(90deg, ${BRAND_PINK}, ${BRAND_BLUE}); width: 100%; }
        table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        th { text-align: left; font-size: 11px; letter-spacing: 0.1em; color: #999; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
        td { padding: 15px 0; border-bottom: 1px solid #f5f5f7; font-size: 14px; }
        .summary-box { background-color: #f9f9fb; border-radius: 16px; padding: 25px; margin: 25px 0; }
        .summary-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .summary-total { border-top: 1px solid #eee; margin-top: 15px; padding-top: 15px; font-weight: 800; font-size: 18px; color: ${BRAND_DARK}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="accent-bar"></div>
        <div class="header">
            <img src="${LOGO_URL}" alt="Naya Lumière" class="logo">
            <h1>Naya Lumière</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumière Cosmetics. All rights reserved.</p>
            <p>
                <a href="#">Privacy Policy</a> &nbsp;•&nbsp; 
                <a href="#">Terms of Service</a> &nbsp;•&nbsp; 
                <a href="#">Contact Us</a>
            </p>
            <p style="margin-top: 20px; opacity: 0.5;">Geneva • Dubai • Paris</p>
        </div>
    </div>
</body>
</html>
`;

export async function sendWelcomeEmail(email, firstName) {
  try {
    const html = emailWrapper(`
        <h2>Welcome to the Sanctuary, ${firstName}</h2>
        <p>Thank you for registering with Naya Lumière Cosmetics. We are delighted to accompany you on your journey toward clinical botanical perfection.</p>
        <p>Explore our curated collections and discover the science of radiance.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}" class="button">Begin Your Ritual</a>
    `, 'Welcome to Naya Lumière');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Naya Lumière Cosmetics',
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false };
  }
}

export async function sendLoginConfirmationEmail(email, firstName) {
  try {
    const html = emailWrapper(`
        <h2>Hello, ${firstName}</h2>
        <p>This is to confirm a successful login to your Naya Lumière account.</p>
        <p>If you did not initiate this login, please protect your sanctuary by changing your password immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}/account" class="button">Manage Account</a>
    `, 'Login Confirmation');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Login Confirmation - Naya Lumière',
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Login email error:', error);
    return { success: false };
  }
}

export async function sendOrderConfirmationEmail(email, firstName, orderId, total_amount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, giftWrapCost) {
  try {
    const itemsHtml = itemsWithDetails.map(item => `
        <tr>
            <td>
                <div style="font-weight: 700;">${item.name}</div>
                <div style="font-size: 11px; color: #999;">Qty: ${item.quantity}</div>
            </td>
            <td style="text-align: right;">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    const content = `
        <h2>Your Ritual is Confirmed</h2>
        <p>Dear ${firstName}, your order <strong>#${orderId}</strong> has been successfully placed. Our laboratory is now preparing your selection.</p>
        
        <div class="summary-box">
            <div class="summary-item"><span>Subtotal</span> <span>AED ${Number(subtotal).toFixed(2)}</span></div>
            <div class="summary-item"><span>Shipping</span> <span>${formatShippingCost(shippingCost)}</span></div>
            ${giftWrapCost > 0 ? `<div class="summary-item"><span>Gift Wrap</span> <span>AED ${Number(giftWrapCost).toFixed(2)}</span></div>` : ''}
            <div class="summary-item"><span>Tax</span> <span>AED ${Number(taxAmount).toFixed(2)}</span></div>
            ${discountAmount > 0 ? `<div class="summary-item" style="color: ${BRAND_PINK};"><span>Discount</span> <span>-AED ${Number(discountAmount).toFixed(2)}</span></div>` : ''}
            <div class="summary-total"><span>Total</span> <span>AED ${Number(total_amount).toFixed(2)}</span></div>
        </div>

        <h3>The Selection</h3>
        <table>
            <thead><tr><th>Product</th><th style="text-align: right;">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
        </table>

        <h3>Shipping Protocol</h3>
        <p style="background-color: #f9f9fb; padding: 20px; border-radius: 12px; font-size: 14px;">
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.zip}<br>
            ${shippingAddress.country}
        </p>

        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}/account/orders" class="button">Track Order</a>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Confirmation #${orderId} - Naya Lumière`,
      html: emailWrapper(content, 'Order Confirmation'),
    });
    return { success: true };
  } catch (error) {
    console.error('Order email error:', error);
    return { success: false };
  }
}

export async function sendAdminNotificationEmail(adminEmail, orderId, customerEmail, total_amount, shippingAddress) {
  try {
    const content = `
        <h2>New Order Received</h2>
        <p>A new acquisition has been recorded in the Naya Lumière boutique. Action is required for fulfillment.</p>
        
        <div class="summary-box">
            <div class="summary-item"><span>Order ID</span> <span>#${orderId}</span></div>
            <div class="summary-item"><span>Customer</span> <span>${customerEmail}</span></div>
            <div class="summary-item"><span>Value</span> <span>AED ${Number(total_amount).toFixed(2)}</span></div>
        </div>

        <h3>Logistics</h3>
        <p style="background-color: #f9f9fb; padding: 20px; border-radius: 12px; font-size: 14px;">
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.zip}<br>
            ${shippingAddress.country}
        </p>

        <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}/admin/orders/${orderId}" class="button">Process Order</a>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      cc: 'waeldal@gmail.com',
      subject: `Action Required: New Order #${orderId}`,
      html: emailWrapper(content, 'Admin Notification'),
    });
    return { success: true };
  } catch (error) {
    console.error('Admin order notification error:', error);
    return { success: false };
  }
}

export async function sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, latestMessageContent) {
  try {
    const content = `
        <h2>New Client Inquiry</h2>
        <p>A new message has been received from <strong>${customerName}</strong> in the specialist chat portal.</p>
        
        <div style="background-color: #f9f9fb; padding: 25px; border-left: 4px solid ${BRAND_BLUE}; border-radius: 0 16px 16px 0; margin: 25px 0; font-style: italic;">
            "${latestMessageContent}"
        </div>
        
        <p>Client: ${customerEmail}</p>
        <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}/admin/chat/${conversationId}" class="button">Respond to Client</a>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Inquiry from ${customerName}`,
      html: emailWrapper(content, 'New Message'),
    });
    return { success: true };
  } catch (error) {
    console.error('Chat notification error:', error);
    return { success: false };
  }
}

export async function sendSubscriptionConfirmationEmail(email) {
  try {
    const content = `
        <h2>Welcome to the Lumière Club</h2>
        <p>You have successfully joined our inner circle. Prepare for a world of clinical beauty delivered to your inbox.</p>
        <ul>
            <li>Exclusive 20% privileged offers</li>
            <li>Early access to avant-première launches</li>
            <li>Bespoke beauty consultations</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}" class="button">Explore the Collection</a>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to the Lumière Club',
      html: emailWrapper(content, 'Subscription Confirmed'),
    });
    return { success: true };
  } catch (error) {
    console.error('Subscription email error:', error);
    return { success: false };
  }
}

export async function sendOrderStatusUpdateEmail(email, firstName, orderId, newStatus, cancellationReason, totalAmount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, trackingNumber, courierName, courierWebsite, orderDetails) {
  try {
    const content = `
        <h2>Order Status Update</h2>
        <p>Dear ${firstName}, the status of your order <strong>#${orderId}</strong> has been updated to: <span style="color: ${BRAND_PINK}; font-weight: 800;">${newStatus}</span>.</p>
        
        <div class="summary-box">
            <div class="summary-item"><span>Status</span> <span>${newStatus}</span></div>
            ${newStatus === 'Cancelled' && cancellationReason ? `<div class="summary-item"><span>Reason</span> <span>${cancellationReason}</span></div>` : ''}
            ${trackingNumber ? `<div class="summary-item"><span>Tracking</span> <span>${trackingNumber}</span></div>` : ''}
            ${courierName ? `<div class="summary-item"><span>Courier</span> <span>${courierName}</span></div>` : ''}
        </div>

        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}/account/orders" class="button">View Order Details</a>
    `;

    const invoiceHtml = generateInvoiceHtml(orderDetails);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Update: Order #${orderId} is ${newStatus}`,
      html: emailWrapper(content, 'Status Update'),
      attachments: [{
        filename: `invoice-${orderId}.html`,
        content: invoiceHtml,
        contentType: 'text/html',
      }],
    });
    return { success: true };
  } catch (error) {
    console.error('Status update email error:', error);
    return { success: false };
  }
}

export async function sendPasswordResetEmail(email, resetToken) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/auth/reset-password?token=${resetToken}`;
    const content = `
        <h2>Restoration of Access</h2>
        <p>A request has been received to restore access to your Naya Lumière sanctuary. If you initiated this request, please use the secure portal below to define a new password.</p>
        <p>This link will expire in 1 hour for your security.</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">If you did not request this, please ignore this email. Your sanctuary remains secure.</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Restoration - Naya Lumière',
      html: emailWrapper(content, 'Reset Password'),
    });
    return { success: true };
  } catch (error) {
    console.error('Reset password email error:', error);
    return { success: false };
  }
}

export function generateInvoiceHtml(orderDetails) {
    // Keeping this function as it is but wrapping it in the new styles could be a next step
    // For now, I'll keep the logic to avoid breaking invoice generation
    const orderDate = new Date(orderDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(orderDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const productsHtml = orderDetails.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>AED ${Number(item.price).toFixed(2)}</td>
            <td style="text-align: right;">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; font-size: 16px; line-height: 24px; color: #555; }
        .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
        .invoice-box table td { padding: 5px; vertical-align: top; }
        .invoice-box table tr td:nth-child(2) { text-align: right; }
        .invoice-box table tr.top table td { padding-bottom: 20px; }
        .invoice-box table tr.information table td { padding-bottom: 40px; }
        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        .invoice-box table tr.details td { padding-bottom: 20px; }
        .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
        .invoice-box table tr.item.last td { border-bottom: none; }
        .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <table>
            <tr class="top">
                <td colspan="4">
                    <table>
                        <tr>
                            <td class="title"><img src="${LOGO_URL}" style="width:100px; max-width:300px;"></td>
                            <td>
                                Invoice #: INV-${orderDetails.id}<br>
                                Created: ${orderDate}<br>
                                Due: ${orderDate}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="information">
                <td colspan="4">
                    <table>
                        <tr>
                            <td>Naya Lumière Cosmetics<br>Dubai, UAE</td>
                            <td>${orderDetails.customerName}<br>${orderDetails.customerEmail}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="heading">
                <td colspan="2">Payment Method</td>
                <td colspan="2">Status</td>
            </tr>
            <tr class="details">
                <td colspan="2">${orderDetails.paymentMethod || 'Credit Card'}</td>
                <td colspan="2">Paid</td>
            </tr>
            <tr class="heading">
                <td>Item</td>
                <td>Quantity</td>
                <td>Price</td>
                <td style="text-align: right;">Total</td>
            </tr>
            ${productsHtml}
            <tr class="total">
                <td colspan="3"></td>
                <td style="text-align: right;">Total: AED ${Number(orderDetails.totalAmount).toFixed(2)}</td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
}
