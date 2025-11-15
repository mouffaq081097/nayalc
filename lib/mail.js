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
      subject: 'Welcome to iHealthCare.ae!',
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