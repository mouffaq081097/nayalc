import nodemailer from 'nodemailer';

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
      subject: 'Welcome to nayalc.com!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for registering with nayalc.com. We're excited to have you!</p>
          <p>Explore our products and enjoy your shopping experience.</p>
          <p>Best regards,<br/>The nayalc.com Team</p>
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
      subject: 'Login Confirmation - nayalc.com',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello, ${firstName}!</h2>
          <p>This is to confirm that you have successfully logged into your nayalc.com account.</p>
          <p>If you did not initiate this login, please change your password immediately and contact our support team.</p>
          <p>Best regards,<br/>The nayalc.com Team</p>
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

export async function sendOrderConfirmationEmail(email, firstName, orderId, total_amount, taxAmount, itemsWithDetails, shippingAddress) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Order Confirmation - nayalc.com',
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
            <h2>Your Order Confirmation - nayalc.com</h2>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for your recent purchase from nayalc.com! We're excited to confirm your order.</p>
            
            <div class="order-summary">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total Amount:</strong> AED ${Number(total_amount).toFixed(2)}</p>
                <p><strong>Tax Amount:</strong> AED ${Number(taxAmount).toFixed(2)}</p>
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

            <p>We will send you another email with tracking information once your order has been shipped.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <a href="#" class="button">View Your Order</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
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
            <p>A new order has been placed on nayalc.com. Please process this order promptly.</p>
            
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
            <p>Thank you,<br>nayalc.com Automated System</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
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