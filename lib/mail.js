import nodemailer from 'nodemailer';

const LOGO_URL  = 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
const LAV_LIGHT = 'rgb(196,167,254)';
const LAV_DARK  = 'rgb(126,105,230)';
const TEXT_DEEP = '#3b0764';
const TEXT_MID  = '#6b21a8';

const formatShippingCost = (cost) => {
    if (!cost || isNaN(cost) || Number(cost) === 0) return 'Free';
    return `AED ${Number(cost).toFixed(2)}`;
};

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
 * Logo + brand name header block — matches navbar treatment
 */
const brandHeader = `
  <div style="display:inline-flex; align-items:center; gap:14px; justify-content:center;">
    <img src="${LOGO_URL}" alt="Naya Lumière" style="height:42px; width:auto; display:block;">
    <div style="text-align:left; line-height:1.25;">
      <div style="font-size:18px; font-weight:600; letter-spacing:0.05em; color:${TEXT_DEEP}; text-transform:uppercase; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">NAYA</div>
      <div style="font-size:12px; font-style:italic; font-family:Georgia,'Times New Roman',serif; color:${TEXT_MID}; margin-top:1px;">Lumière Cosmetics</div>
    </div>
  </div>
`;

/**
 * Global Email Wrapper Template — Cloud Luxe Lavender
 */
const emailWrapper = (content, title) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: ${TEXT_DEEP};
            background-color: #fdf8ff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(147,51,234,0.10), 0 2px 12px rgba(196,167,254,0.15);
            border: 1px solid rgba(216,180,254,0.35);
        }
        .accent-bar {
            height: 4px;
            background: linear-gradient(90deg, ${LAV_LIGHT}, ${LAV_DARK});
            width: 100%;
        }
        .header {
            background-color: #ffffff;
            padding: 36px 24px 32px;
            text-align: center;
            border-bottom: 1px solid rgba(216,180,254,0.2);
        }
        .content {
            padding: 40px;
        }
        .content h2 {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 18px;
            color: ${TEXT_DEEP};
            letter-spacing: -0.02em;
        }
        .content h3 {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: ${LAV_DARK};
            margin: 30px 0 12px;
        }
        .content p {
            font-size: 15px;
            color: rgba(59,7,100,0.60);
            margin-bottom: 14px;
        }
        .content ul {
            color: rgba(59,7,100,0.60);
            font-size: 15px;
            padding-left: 20px;
            margin-bottom: 20px;
        }
        .content ul li {
            margin-bottom: 8px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, ${LAV_LIGHT}, ${LAV_DARK});
            color: #ffffff !important;
            padding: 16px 36px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-top: 24px;
            box-shadow: 0 6px 24px rgba(147,51,234,0.25);
        }
        .summary-box {
            background-color: #f8f0ff;
            border: 1px solid rgba(216,180,254,0.30);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: rgba(59,7,100,0.65);
        }
        .summary-total {
            border-top: 1px solid rgba(216,180,254,0.35);
            margin-top: 14px;
            padding-top: 14px;
            font-weight: 900;
            font-size: 18px;
            color: ${TEXT_DEEP};
            display: flex;
            justify-content: space-between;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            text-align: left;
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: ${LAV_DARK};
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(216,180,254,0.3);
            font-weight: 800;
        }
        td {
            padding: 14px 0;
            border-bottom: 1px solid rgba(216,180,254,0.15);
            font-size: 14px;
            color: rgba(59,7,100,0.65);
        }
        .address-box {
            background-color: #f8f0ff;
            border: 1px solid rgba(216,180,254,0.25);
            padding: 20px 24px;
            border-radius: 12px;
            font-size: 14px;
            color: rgba(59,7,100,0.65);
            line-height: 1.8;
        }
        .footer {
            text-align: center;
            font-size: 11px;
            color: rgba(59,7,100,0.40);
            padding: 36px 24px;
            background-color: #f8f0ff;
            border-top: 1px solid rgba(216,180,254,0.2);
        }
        .footer a {
            color: ${LAV_DARK};
            text-decoration: none;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="accent-bar"></div>
        <div class="header">
            ${brandHeader}
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumière Cosmetics. All rights reserved.</p>
            <p>
                <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="#">Terms of Service</a> &nbsp;·&nbsp;
                <a href="#">Contact Us</a>
            </p>
            <p style="margin-top:16px; opacity:0.5; font-size:10px; letter-spacing:0.15em; text-transform:uppercase;">Geneva &nbsp;·&nbsp; Dubai &nbsp;·&nbsp; Paris</p>
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
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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

export async function sendOrderConfirmationEmail(email, firstName, orderId, total_amount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, giftWrapCost, couponCode = null) {
  try {
    const itemsHtml = itemsWithDetails.map(item => `
        <tr>
            <td>
                <div style="font-weight:700; color:${TEXT_DEEP};">${item.name}</div>
                <div style="font-size:11px; color:rgba(59,7,100,0.45); margin-top:2px;">Qty: ${item.quantity}</div>
            </td>
            <td style="text-align:right; font-weight:700; color:${TEXT_DEEP};">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    const content = `
        <h2>Your Ritual is Confirmed</h2>
        <p>Dear ${firstName}, your order <strong style="color:${TEXT_DEEP};">#${orderId}</strong> has been successfully placed. Our team is now carefully preparing your selection.</p>

        <div class="summary-box">
            <div class="summary-item"><span>Subtotal</span><span>AED ${Number(subtotal).toFixed(2)}</span></div>
            <div class="summary-item"><span>Shipping</span><span>${formatShippingCost(shippingCost)}</span></div>
            ${giftWrapCost > 0 ? `<div class="summary-item"><span>Gift Wrap</span><span>AED ${Number(giftWrapCost).toFixed(2)}</span></div>` : ''}
            <div class="summary-item"><span>Tax (VAT)</span><span>AED ${Number(taxAmount).toFixed(2)}</span></div>
            ${discountAmount > 0 ? `<div class="summary-item" style="color:${LAV_DARK};font-weight:700;"><span>Discount ${couponCode ? `<span style="font-weight:400; font-size: 11px; opacity: 0.8;">(${couponCode})</span>` : ''}</span><span>−AED ${Number(discountAmount).toFixed(2)}</span></div>` : ''}
            <div class="summary-total"><span>Total</span><span>AED ${Number(total_amount).toFixed(2)}</span></div>
        </div>

        <h3>The Selection</h3>
        <table>
            <thead><tr><th>Product</th><th style="text-align:right;">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
        </table>

        <h3>Shipping Destination</h3>
        <div class="address-box">
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.zip}<br>
            ${shippingAddress.country}
        </div>

        <a href="${process.env.NEXT_PUBLIC_BASE_URL || '#'}/account/orders" class="button">Track Order</a>
    `;

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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
            <div class="summary-item"><span>Order ID</span><span style="font-weight:700; color:${TEXT_DEEP};">#${orderId}</span></div>
            <div class="summary-item"><span>Customer</span><span>${customerEmail}</span></div>
            <div class="summary-item"><span>Order Value</span><span style="font-weight:800; color:${TEXT_DEEP};">AED ${Number(total_amount).toFixed(2)}</span></div>
        </div>

        <h3>Shipping Destination</h3>
        <div class="address-box">
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.zip}<br>
            ${shippingAddress.country}
        </div>

        <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}/admin/orders/${orderId}" class="button">Process Order</a>
    `;

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Action Required: New Order #${orderId}`,
      html: emailWrapper(content, 'Admin Notification'),
    });
    console.log(`Admin notification email sent for order #${orderId}`);
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
        <p>A new message has been received from <strong style="color:${TEXT_DEEP};">${customerName}</strong> in the specialist chat portal.</p>

        <div style="background-color:#f8f0ff; padding:24px; border-left:4px solid ${LAV_LIGHT}; border-radius:0 16px 16px 0; margin:24px 0; font-style:italic; color:rgba(59,7,100,0.65); font-size:15px; line-height:1.7;">
            "${latestMessageContent}"
        </div>

        <p>Client: <span style="color:${LAV_DARK}; font-weight:700;">${customerEmail}</span></p>
        <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}/admin/chat/${conversationId}" class="button">Respond to Client</a>
    `;

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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

export async function sendOrderStatusUpdateEmail(email, firstName, orderId, newStatus, cancellationReason, totalAmount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, trackingNumber, courierName, courierWebsite, orderDetails, pointsEarned) {
  try {
    const content = `
        <h2>Order Status Update</h2>
        <p>Dear ${firstName}, your order <strong style="color:${TEXT_DEEP};">#${orderId}</strong> has been updated to: <span style="color:${LAV_DARK}; font-weight:800;">${newStatus}</span>.</p>

        <div class="summary-box">
            <div class="summary-item"><span>Status</span><span style="font-weight:700; color:${TEXT_DEEP};">${newStatus}</span></div>
            ${newStatus === 'Cancelled' && cancellationReason ? `<div class="summary-item"><span>Reason</span><span>${cancellationReason}</span></div>` : ''}
            ${trackingNumber ? `<div class="summary-item"><span>Tracking No.</span><span style="font-weight:700; color:${TEXT_DEEP};">${trackingNumber}</span></div>` : ''}
            ${courierName ? `<div class="summary-item"><span>Courier</span><span>${courierName}</span></div>` : ''}
        </div>
        
        ${newStatus === 'Delivered' && pointsEarned ? `
        <div style="background: linear-gradient(135deg, rgba(196,167,254,0.1), rgba(126,105,230,0.1)); border: 1px solid rgba(196,167,254,0.3); padding: 20px; border-radius: 12px; margin-top: 24px; text-align: center;">
            <p style="margin: 0; color: ${TEXT_DEEP}; font-size: 14px; font-weight: 600;">✨ You have earned <strong style="color:${LAV_DARK}; font-size: 16px;">${pointsEarned}</strong> Loyalty Points from this order! ✨</p>
            <p style="margin: 8px 0 0 0; color: rgba(59,7,100,0.6); font-size: 12px;">These points have been added to your sanctuary account and can be redeemed on your next purchase.</p>
        </div>
        ` : ''}

        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account/orders" class="button">View Order Details</a>
    `;

    const invoiceHtml = generateInvoiceHtml(orderDetails);
    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const content = `
        <h2>Restoration of Access</h2>
        <p>A request has been received to restore access to your Naya Lumière sanctuary. If you initiated this request, please use the secure portal below to define a new password.</p>
        <p>This link will expire in <strong style="color:${TEXT_DEEP};">1 hour</strong> for your security.</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p style="margin-top:28px; font-size:12px; color:rgba(59,7,100,0.35);">If you did not request this, please ignore this email. Your sanctuary remains secure.</p>
    `;

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
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

export async function sendPayoutRequestNotificationEmail(recipients, amount, currency, payoutId) {
  try {
    const content = `
        <h2>Payout Requested</h2>
        <p>A manual payout has been initiated from the Naya Lumière Stripe account.</p>

        <div class="summary-box">
            <div class="summary-item"><span>Payout ID</span><span style="font-weight:700; color:${TEXT_DEEP};">${payoutId}</span></div>
            <div class="summary-item"><span>Amount</span><span style="font-weight:800; color:${TEXT_DEEP};">${amount.toFixed(2)} ${currency.toUpperCase()}</span></div>
            <div class="summary-item"><span>Status</span><span style="color:${LAV_DARK}; font-weight:700;">Pending Processing</span></div>
        </div>

        <p>This request was triggered from the Admin Payments dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || '#'}/admin/payments" class="button">Review Payments</a>
    `;

    await transporter.sendMail({
      from: `"Naya Lumière Cosmetics" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: `Payout Requested: ${amount.toFixed(2)} ${currency.toUpperCase()}`,
      html: emailWrapper(content, 'Payout Notification'),
    });
    return { success: true };
  } catch (error) {
    console.error('Payout notification email error:', error);
    return { success: false };
  }
}

export function generateInvoiceHtml(orderDetails) {
    const orderDate = new Date(orderDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(orderDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const productsHtml = orderDetails.items.map(item => `
        <tr>
            <td style="padding:14px 8px; border-bottom:1px solid rgba(216,180,254,0.2); color:rgba(59,7,100,0.70); font-size:14px;">${item.name}</td>
            <td style="padding:14px 8px; border-bottom:1px solid rgba(216,180,254,0.2); color:rgba(59,7,100,0.60); font-size:14px; text-align:center;">${item.quantity}</td>
            <td style="padding:14px 8px; border-bottom:1px solid rgba(216,180,254,0.2); color:rgba(59,7,100,0.60); font-size:14px;">AED ${Number(item.price).toFixed(2)}</td>
            <td style="padding:14px 8px; border-bottom:1px solid rgba(216,180,254,0.2); color:#3b0764; font-size:14px; font-weight:700; text-align:right;">AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fdf8ff; margin: 0; padding: 0; color: #3b0764; }
    </style>
</head>
<body>
    <div style="max-width:800px; margin:40px auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid rgba(216,180,254,0.35); box-shadow:0 8px 40px rgba(147,51,234,0.08);">

        <!-- Accent bar -->
        <div style="height:4px; background:linear-gradient(90deg, rgb(196,167,254), rgb(126,105,230)); width:100%;"></div>

        <!-- Header -->
        <div style="padding:36px 40px 28px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(216,180,254,0.2);">
            <div style="display:inline-flex; align-items:center; gap:14px;">
                <img src="${LOGO_URL}" alt="Naya Lumière" style="height:42px; width:auto; display:block;">
                <div style="text-align:left; line-height:1.25;">
                    <div style="font-size:18px; font-weight:600; letter-spacing:0.05em; color:#3b0764; text-transform:uppercase; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">NAYA</div>
                    <div style="font-size:12px; font-style:italic; font-family:Georgia,'Times New Roman',serif; color:#6b21a8;">Lumière Cosmetics</div>
                </div>
            </div>
            <div style="text-align:right; font-size:13px; color:rgba(59,7,100,0.55);">
                <div style="font-size:18px; font-weight:900; color:#3b0764; margin-bottom:6px;">INVOICE</div>
                <div>No. <strong style="color:#3b0764;">INV-${orderDetails.id}</strong></div>
                <div style="margin-top:4px;">${orderDate} · ${orderTime}</div>
            </div>
        </div>

        <!-- Billing info -->
        <div style="padding:28px 40px; display:flex; justify-content:space-between; border-bottom:1px solid rgba(216,180,254,0.15);">
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:rgb(126,105,230); margin-bottom:10px;">From</div>
                <div style="font-size:14px; color:rgba(59,7,100,0.70); line-height:1.8;">
                    Naya Lumière Cosmetics<br>
                    Dubai, United Arab Emirates
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:rgb(126,105,230); margin-bottom:10px;">Bill To</div>
                <div style="font-size:14px; color:rgba(59,7,100,0.70); line-height:1.8;">
                    ${orderDetails.customerName}<br>
                    ${orderDetails.customerEmail}
                </div>
            </div>
        </div>

        <!-- Payment status -->
        <div style="padding:20px 40px; display:flex; gap:40px; border-bottom:1px solid rgba(216,180,254,0.15);">
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:rgb(126,105,230); margin-bottom:6px;">Payment Method</div>
                <div style="font-size:14px; color:rgba(59,7,100,0.70);">${orderDetails.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
                <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:rgb(126,105,230); margin-bottom:6px;">Status</div>
                <div style="font-size:14px; font-weight:700; color:#3b0764;">Paid</div>
            </div>
        </div>

        <!-- Items table -->
        <div style="padding:28px 40px;">
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f8f0ff;">
                        <th style="padding:12px 8px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:rgb(126,105,230); border-bottom:1px solid rgba(216,180,254,0.3);">Item</th>
                        <th style="padding:12px 8px; text-align:center; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:rgb(126,105,230); border-bottom:1px solid rgba(216,180,254,0.3);">Qty</th>
                        <th style="padding:12px 8px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:rgb(126,105,230); border-bottom:1px solid rgba(216,180,254,0.3);">Unit Price</th>
                        <th style="padding:12px 8px; text-align:right; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:rgb(126,105,230); border-bottom:1px solid rgba(216,180,254,0.3);">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding:20px 8px 8px; text-align:right; font-size:14px; color:rgba(59,7,100,0.55);">Total</td>
                        <td style="padding:20px 8px 8px; text-align:right; font-size:20px; font-weight:900; color:#3b0764; border-top:2px solid rgba(216,180,254,0.35);">AED ${Number(orderDetails.totalAmount).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Footer -->
        <div style="padding:24px 40px; background:#f8f0ff; border-top:1px solid rgba(216,180,254,0.2); text-align:center;">
            <p style="font-size:11px; color:rgba(59,7,100,0.40); margin:0 0 4px;">Thank you for choosing Naya Lumière Cosmetics.</p>
            <p style="font-size:10px; color:rgba(59,7,100,0.30); margin:0; letter-spacing:0.15em; text-transform:uppercase;">Geneva &nbsp;·&nbsp; Dubai &nbsp;·&nbsp; Paris</p>
        </div>
    </div>
</body>
</html>
    `;
}
