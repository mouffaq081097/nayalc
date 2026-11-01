import { TRANSIT_LABEL, FREE_SHIPPING_FROM } from './shipping.js';
import { RETURN_WINDOW_DAYS, REFUND_WITHIN_DAYS } from './policies.js';

/**
 * Ready answers for Admin → Inbox. A click puts one in the reply box, with the
 * customer's first name, to send as it is or edit. The facts come from the
 * same rules the storefront shows (lib/shipping.js, lib/policies.js).
 */
export const QUICK_REPLIES = [
  { label: 'Hello', text: (name) => `Hi ${name}, thank you for your message. How can I help you today?` },
  { label: 'Order status', text: (name) => `Hi ${name}, I'll check your order for you. Could you send me your order number? You'll find it in your confirmation email.` },
  {
    label: 'Delivery',
    text: (name) => `Hi ${name}, we deliver across the UAE in ${TRANSIT_LABEL}, and delivery is free from ${FREE_SHIPPING_FROM} items. Once your order ships, you'll get a tracking link by email.`,
  },
  {
    label: 'Returns',
    text: (name) => `Hi ${name}, unopened products can be returned within ${RETURN_WINDOW_DAYS} days of delivery. Once the return reaches us, the refund goes back to your original payment method within ${REFUND_WITHIN_DAYS} days.`,
  },
  { label: 'Thank you', text: (name) => `Thank you, ${name}! If there's anything else, I'm here to help.` },
];

/** The first name to greet a customer by, or "there". */
export const firstNameOf = (fullName) => String(fullName || '').trim().split(/\s+/)[0] || 'there';
