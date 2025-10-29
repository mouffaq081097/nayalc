import { getOrderConfirmationHtml } from './email-templates/order-confirmation';
import { getWelcomeEmailHtml } from './email-templates/welcome-email';
import { getLoginConfirmationEmailHtml } from './email-templates/login-confirmation';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOrderConfirmationEmail = async (to, orderDetails) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: `Your iHealthCare.ae Order Confirmation #${orderDetails.orderId}`,
    html: getOrderConfirmationHtml(orderDetails),
  };

  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent successfully.');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Optionally, re-throw the error to be handled by the caller
    // throw error;
  }
};

export const sendWelcomeEmail = async (to, userName) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: `Welcome to nayalc.com, ${userName}!`,
    html: getWelcomeEmailHtml(userName),
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent successfully.');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendLoginConfirmationEmail = async (to, userName) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: `Login Notification for your nayalc.com Account`,
    html: getLoginConfirmationEmailHtml(userName),
  };

  try {
    await sgMail.send(msg);
    console.log('Login confirmation email sent successfully.');
  } catch (error) {
    console.error('Error sending login confirmation email:', error);
  }
};