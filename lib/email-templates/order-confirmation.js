export const getOrderConfirmationHtml = (orderDetails) => {
  const { orderId, items, totalAmount, taxAmount, shippingAddress } = orderDetails;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Naya Lumiere</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f8f8; color: #333; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #eee; }
        .header { text-align: center; padding-bottom: 25px; border-bottom: 1px solid #eee; margin-bottom: 25px; }
        .logo-text { 
          font-family: 'Georgia', serif; /* Using a serif font for elegance */
          font-size: 32px; 
          font-weight: bold; 
          margin: 0; 
          background-image: linear-gradient(to right, #A78BFA, #EC4899); /* var(--brand-blue) to var(--brand-pink) */
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .logo-subtext { font-size: 14px; color: #666; margin-top: 5px; font-style: italic; }
        .content h2 { color: #333; font-size: 24px; margin-bottom: 15px; }
        .content p { font-size: 16px; line-height: 1.6; margin-bottom: 10px; }
        .order-summary, .shipping-address { margin-top: 30px; margin-bottom: 30px; border: 1px solid #eee; border-radius: 8px; }
        .order-summary h3, .shipping-address h3 { background-color: #f9f9f9; padding: 15px; margin: 0; font-size: 18px; border-bottom: 1px solid #eee; border-radius: 8px 8px 0 0; }
        .order-details-table { width: 100%; border-collapse: collapse; }
        .order-details-table th, .order-details-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; font-size: 15px; }
        .order-details-table th { background-color: #fcfcfc; font-weight: bold; color: #555; }
        .order-details-table td.product-col { display: flex; align-items: center; }
        .order-details-table td.product-col img { width: 60px; height: 60px; object-fit: cover; margin-right: 10px; border-radius: 4px; border: 1px solid #eee; }
        .order-details-table tfoot td { font-size: 16px; font-weight: bold; border-top: 2px solid #ddd; }
        .total-row td { color: #000; }
        .address-details { padding: 15px; line-height: 1.6; font-size: 15px; }
        .footer { text-align: center; padding-top: 25px; border-top: 1px solid #eee; font-size: 13px; color: #888; margin-top: 25px; }
        .button { display: inline-block; background-color: #EC4899; color: #ffffff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-text">Naya Lumière</h1>
          <p class="logo-subtext">Parisian Beauty</p>
        </div>
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Hello,</p>
          <p>Thank you for your recent purchase! Your order <strong>#${orderId}</strong> has been successfully placed and is being prepared for shipment. We're thrilled to have you as part of the Naya Lumière family!</p>
          
          <div class="order-summary">
            <h3>Order Summary</h3>
            <table class="order-details-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td class="product-col">
                      <img src="${item.imageUrl}" alt="${item.name}" />
                      <span>${item.name}</span>
                    </td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right;">AED ${item.price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="text-align: right;">Subtotal</td>
                  <td style="text-align: right;">AED ${(totalAmount - taxAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="text-align: right;">Tax</td>
                  <td style="text-align: right;">AED ${taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;"><strong>Total</strong></td>
                  <td style="text-align: right;"><strong>AED ${totalAmount.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${shippingAddress ? `
            <div class="shipping-address">
              <h3>Shipping Address</h3>
              <div class="address-details">
                <p>${shippingAddress.street}</p>
                <p>${shippingAddress.city}, ${shippingAddress.zip}</p>
                <p>${shippingAddress.country}</p>
              </div>
            </div>
          ` : ''}

          <p>We will send you another email with tracking information once your order has shipped. In the meantime, you can view your order status by logging into your account.</p>
          <p>If you have any questions, please don't hesitate to contact our customer support team.</p>
          <p style="text-align: center;">
            <a href="#" class="button">View Your Order</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Naya Lumière. All rights reserved.</p>
          <p>Follow us on social media for beauty tips and exclusive offers!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};