import { getOrderConfirmationHtml } from './email-templates/order-confirmation';
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