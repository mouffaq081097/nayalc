import nodemailer from 'nodemailer';

const formatShippingCost = (cost) => {
    if (!cost || isNaN(cost) || Number(cost) === 0) {
        return 'FREE';
    }
    return `AED ${Number(cost).toFixed(2)}`;
};

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // Use 'true' or 'false' string in .env
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendWelcomeEmail(email, firstName) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Naya Lumiere Cosmetics!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for registering with Naya Lumiere Cosmetics. We're excited to have you!</p>
          <p>Explore our products and enjoy your shopping experience.</p>
          <p>Best regards,<br/>The Naya Lumiere Cosmetics Team</p>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${firstName} at ${email}`);
    return { success: true, message: 'Welcome email sent successfully.' };
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    return { success: false, message: 'Failed to send welcome email.' };
  }
}

export async function sendLoginConfirmationEmail(email, firstName) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Login Confirmation - Naya Lumiere Cosmetics',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello, ${firstName}!</h2>
          <p>This is to confirm that you have successfully logged into your Naya Lumiere Cosmetics account.</p>
          <p>If you did not initiate this login, please change your password immediately and contact our support team.</p>
          <p>Best regards,<br/>The Naya Lumiere Cosmetics Team</p>
        </div>
      `,
    });
    console.log(`Login confirmation email sent to ${firstName} at ${email}`);
    return { success: true, message: 'Login confirmation email sent successfully.' };
  } catch (error) {
    console.error(`Error sending login confirmation email to ${email}:`, error);
    return { success: false, message: 'Failed to send login confirmation email.' };
  }
}

export async function sendOrderConfirmationEmail(email, firstName, orderId, total_amount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, giftWrapCost) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Order Confirmation - Naya Lumiere Cosmetics',
      html: `
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
            <h2>Your Order Confirmation - Naya Lumiere Cosmetics</h2>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for your recent purchase from Naya Lumiere Cosmetics! We're excited to confirm your order.</p>
            
            <div class="order-summary">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Subtotal:</strong> AED ${Number(subtotal).toFixed(2)}</p>
                <p><strong>Shipping:</strong> ${formatShippingCost(shippingCost)}</p>
                ${giftWrapCost > 0 ? `<p><strong>Gift Wrap:</strong> AED ${Number(giftWrapCost).toFixed(2)}</p>` : ''}
                <p><strong>Tax Amount:</strong> AED ${Number(taxAmount).toFixed(2)}</p>
                <p><strong>Discount:</strong> AED ${Number(discountAmount).toFixed(2)}</p>
                <p><strong>Total Amount:</strong> AED ${Number(total_amount).toFixed(2)}</p>
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
                    ${itemsWithDetails.map(item => `
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

            <p>We will update you with the tracking number.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <a href="#" class="button">View Your Order</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumiere Cosmetics. All rights reserved.</p>
            <p><a href="#" style="color: #007bff;">Privacy Policy</a> | <a href="#" style="color: #007bff;">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
`,
    });
    console.log(`Order confirmation email sent to ${firstName} at ${email}`);
    return { success: true, message: 'Order confirmation email sent successfully.' };
  } catch (error) {
    console.error(`Error sending order confirmation email to ${email}:`, error);
    return { success: false, message: 'Failed to send order confirmation email.' };
  }
}

export async function sendAdminNotificationEmail(adminEmail, orderId, customerEmail, total_amount, shippingAddress) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      cc: 'waeldal@gmail.com',
      subject: `New Order #${orderId} - Action Required`,
      html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background-color: #FFC107; color: white; padding: 10px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Order Received - Action Required!</h2>
        </div>
        <div class="content">
            <p>Dear Administrator,</p>
            <p>A new order has been placed on Naya Lumiere Cosmetics. Please process this order promptly.</p>
            
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Total Amount:</strong> AED ${Number(total_amount).toFixed(2)}</p>
            <p><strong>Shipping Address:</strong></p>
            <p>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.zip}<br>
                ${shippingAddress.country}
            </p>

            <p>Please log in to the admin panel to view full order details and initiate shipping.</p>
            <p>Thank you,<br>Naya Lumiere Cosmetics Automated System</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumiere Cosmetics. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`,
    });
    console.log(`Admin notification email sent for order ${orderId} to ${adminEmail}`);
    return { success: true, message: 'Admin notification email sent successfully.' };
  } catch (error) {
    console.error(`Error sending admin notification email for order ${orderId} to ${adminEmail}:`, error);
    return { success: false, message: 'Failed to send admin notification email.' };
  }
}

export async function sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, latestMessageContent) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Customer Message in Conversation ID: ${conversationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>New Message Received!</h2>
          <p>A new message has been received from a customer in the chat portal.</p>
          
          <h3>Conversation Details:</h3>
          <p><strong>Customer Name:</strong> ${customerName}</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
          
          <h3>Latest Message:</h3>
          <p style="background-color: #f0f0f0; padding: 15px; border-left: 5px solid #007bff; white-space: pre-wrap;">${latestMessageContent}</p>
          
          <p>Please log in to the admin panel to view the full conversation and respond:</p>
          <p><a href="${process.env.NEXT_PUBLIC_ADMIN_URL}/admin/chat/${conversationId}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Conversation</a></p>
          
          <p>Thank you,<br/>Naya Lumiere Cosmetics Automated System</p>
        </div>
      `,
    });
    console.log(`New chat message notification email sent for conversation ${conversationId} to ${adminEmail}`);
    return { success: true, message: 'New chat message notification email sent successfully.' };
  } catch (error) {
    console.error(`Error sending new chat message notification email for conversation ${conversationId} to ${adminEmail}:`, error);
    return { success: false, message: 'Failed to send new chat message notification email.' };
  }
}

export async function sendSubscriptionConfirmationEmail(email) {
  try {
    const subject = 'Welcome to the Lumière Club - Naya Lumiere Cosmetics';
    const htmlBody = `
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
        .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-top: 1px solid #e0e0e0; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to the Lumière Club!</h2>
        </div>
        <div class="content">
            <p>Dear Subscriber,</p>
            <p>Thank you for joining the Naya Lumiere Cosmetics Lumière Club! You're now part of an exclusive community that receives:</p>
            <ul>
                <li>Exclusive 20% off offers</li>
                <li>New arrivals first access</li>
                <li>Personalized beauty tips</li>
            </ul>
            <p>Get ready for a world of beauty delivered straight to your inbox.</p>
            <p>If you have any questions, feel free to contact us.</p>
            <a href="#" class="button">Visit Naya Lumiere Cosmetics</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumiere Cosmetics. All rights reserved.</p>
            <p><a href="#" style="color: #007bff;">Privacy Policy</a> | <a href="#" style="color: #007bff;">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlBody,
    });
    console.log(`Subscription confirmation email sent to ${email}`);
    return { success: true, message: 'Subscription confirmation email sent successfully.' };
  } catch (error) {
    console.error(`Error sending subscription confirmation email to ${email}:`, error);
    return { success: false, message: 'Failed to send subscription confirmation email.' };
  }
}

export async function sendOrderStatusUpdateEmail(email, firstName, orderId, newStatus, cancellationReason, totalAmount, taxAmount, discountAmount, subtotal, shippingCost, itemsWithDetails, shippingAddress, trackingNumber, courierName, courierWebsite, orderDetails) {
  try {
    const invoiceHtml = generateInvoiceHtml(orderDetails); // Generate HTML invoice
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order #${orderId} Status Updated to ${newStatus} - Naya Lumiere Cosmetics`,
      html: `
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
            <h2>Your Order Status Update - Naya Lumiere Cosmetics</h2>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>We're writing to inform you that the status of your order <strong>#${orderId}</strong> has been updated to: <strong>${newStatus}</strong>.</p>
            
            <div class="order-summary">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Current Status:</strong> ${newStatus}</p>
                ${newStatus === 'Cancelled' && cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>` : ''}
                <p><strong>Subtotal:</strong> AED ${Number(subtotal).toFixed(2)}</p>
                <p><strong>Shipping:</strong> ${formatShippingCost(shippingCost)}</p>
                <p><strong>Tax Amount:</strong> AED ${Number(taxAmount).toFixed(2)}</p>
                <p><strong>Discount:</strong> AED ${Number(discountAmount).toFixed(2)}</p>
                <p><strong>Total Amount:</strong> AED ${Number(totalAmount).toFixed(2)}</p>
                ${(trackingNumber && courierWebsite) ? `<p><strong>Tracking Number:</strong> <a href="${courierWebsite}${trackingNumber}" target="_blank">${trackingNumber}</a></p>` : trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                ${courierName ? `<p><strong>Courier:</strong> ${courierName}</p>` : ''}
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
                    ${itemsWithDetails.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>AED ${Number(item.price).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Shipping Address</h3>
            <p>
                ${shippingAddress.addressLine1}<br>
                ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}
                ${shippingAddress.city}${shippingAddress.state ? ', ' + shippingAddress.state : ''} ${shippingAddress.postalCode}<br>
                ${shippingAddress.country}
            </p>

            <p>We will send you another email with tracking information once your order has been shipped.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <a href="#" class="button">View Your Order</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumiere Cosmetics. All rights reserved.</p>
            <p><a href="#" style="color: #007bff;">Privacy Policy</a> | <a href="#" style="color: #007bff;">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
`,
      attachments: [
        {
          filename: `invoice-${orderId}.html`,
          content: invoiceHtml,
          contentType: 'text/html',
        },
      ],
    });
    console.log(`Order status update email for order ${orderId} sent to ${firstName} at ${email}`);
    return { success: true, message: 'Order status update email sent successfully.' };
  } catch (error) {
    console.error(`Error sending order status update email for order ${orderId} to ${email}:`, error);
    return { success: false, message: 'Failed to send order status update email.' };
  }
}

export function generateInvoiceHtml(orderDetails) {
    const orderDate = new Date(orderDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = new Date(orderDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const productsHtml = orderDetails.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>AED ${Number(item.price).toFixed(2)}</td>
            <td>AED ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
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
        .invoice-details, .customer-info, .shipping-info, .totals-summary { margin-bottom: 25px; border: 1px solid #eee; padding: 15px; border-radius: 5px; }
        .invoice-details p, .customer-info p, .shipping-info p, .totals-summary p { margin: 5px 0; }
        h3 { color: #007bff; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
        th { background-color: #f0f0f0; color: #555; font-weight: bold; }
        .text-right { text-align: right; }
        .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Invoice - Naya Lumiere Cosmetics</h2>
        </div>
        <div class="content">
            <h3>Invoice Details</h3>
            <div class="invoice-details">
                <p><strong>Invoice No:</strong> INV-${orderDetails.id}</p>
                <p><strong>Order ID:</strong> ${orderDetails.id}</p>
                <p><strong>Invoice Date:</strong> ${orderDate} ${orderTime}</p>
                <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
            </div>

            <h3>Customer Information</h3>
            <div class="customer-info">
                <p><strong>Name:</strong> ${orderDetails.customerName}</p>
                <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
                <p><strong>Phone:</strong> ${orderDetails.customerPhone}</p>
            </div>

            <h3>Shipping Address</h3>
            <div class="shipping-info">
                <p>${orderDetails.shippingAddress.addressLine1}</p>
                ${orderDetails.shippingAddress.addressLine2 ? `<p>${orderDetails.shippingAddress.addressLine2}</p>` : ''}
                <p>${orderDetails.shippingAddress.city}${orderDetails.shippingAddress.state ? ', ' + orderDetails.shippingAddress.state : ''} ${orderDetails.shippingAddress.postalCode}</p>
                <p>${orderDetails.shippingAddress.country}</p>
            </div>

            <h3>Products</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHtml}
                </tbody>
            </table>

            <div class="totals-summary text-right">
                <p><strong>Subtotal:</strong> AED ${Number(orderDetails.subtotal).toFixed(2)}</p>
                <p><strong>Discount:</strong> - AED ${Number(orderDetails.discountAmount).toFixed(2)}</p>
                <p><strong>Tax:</strong> AED ${Number(orderDetails.taxAmount).toFixed(2)}</p>
                <p><strong>Shipping:</strong> ${formatShippingCost(orderDetails.shippingCost)}</p>
                <h3><strong>Total:</strong> AED ${Number(orderDetails.totalAmount).toFixed(2)}</h3>
            </div>
            
            <p>Thank you for your purchase!</p>
            <p>If you have any questions about this invoice, please contact us.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Naya Lumiere Cosmetics. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}