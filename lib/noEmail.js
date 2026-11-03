/**
 * Customers ordering by phone may have no email, but users.email is required.
 * Such accounts get a placeholder on the reserved ".invalid" domain (it can
 * never receive mail): "no-email-971501234567@phone-order.invalid".
 * deliver() in lib/mail.js skips these addresses, and the admin shows "No email".
 * Isomorphic: no imports.
 */
export const NO_EMAIL_DOMAIN = 'phone-order.invalid';

export const placeholderEmail = (e164) => `no-email-${String(e164).replace(/\D/g, '')}@${NO_EMAIL_DOMAIN}`;

/** True for a placeholder (or any address on a reserved .invalid domain). */
export const isPlaceholderEmail = (email) => /\.invalid$/i.test(String(email || '').trim());

/** The address to show or use, or '' when the customer has no real email. */
export const realEmail = (email) => (isPlaceholderEmail(email) ? '' : String(email || ''));
