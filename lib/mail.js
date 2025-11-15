export async function sendWelcomeEmail(email, firstName) {
  console.log(`Sending welcome email to ${firstName} at ${email}`);
  // In a real application, you would integrate with an email service here (e.g., SendGrid, Nodemailer)
  // For now, we'll just log the action.
  return Promise.resolve({ success: true, message: 'Welcome email simulated successfully.' });
}