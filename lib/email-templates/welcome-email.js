export const getWelcomeEmailHtml = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to nayalc.com</title>
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
        .footer { text-align: center; padding-top: 25px; border-top: 1px solid #eee; font-size: 13px; color: #888; margin-top: 25px; }
        .button { display: inline-block; background-color: #EC4899; color: #ffffff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-text">nayalc.com</h1>
          <p class="logo-subtext">Your Beauty, Our Passion</p>
        </div>
        <div class="content">
          <h2>Welcome, ${userName}!</h2>
          <p>Thank you for registering with nayalc.com. We're excited to have you join our community!</p>
          <p>At nayalc.com, you can discover a wide range of premium health and beauty products, exclusive offers, and personalized recommendations.</p>
          <p>Start exploring now and enjoy your journey with us.</p>
          <p style="text-align: center;">
            <a href="#" class="button">Start Shopping</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
          <p>If you have any questions, please visit our <a href="#" style="color: #EC4899; text-decoration: none;">Help Center</a> or contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};