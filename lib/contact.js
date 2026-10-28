/**
 * How customers reach us, in one place, so the footer, the help pages, the
 * product page and the order screens always agree.
 *
 * WhatsApp appears only once NEXT_PUBLIC_WHATSAPP_NUMBER is set (any UAE format;
 * it goes through lib/phone.js). Until then every WhatsApp link stays hidden
 * and the pages point to email instead.
 */
import { toWhatsApp, formatPhone } from './phone.js';

export const CONTACT_EMAIL = 'info@nayalc.com';

const RAW_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

/** Digits for wa.me links ("9715…"), or null when no usable number is set. */
export const WHATSAPP_DIGITS = RAW_WHATSAPP ? toWhatsApp(RAW_WHATSAPP) : null;

/** The number as people read it ("+971 50 123 4567"), or '' when none is set. */
export const WHATSAPP_DISPLAY = WHATSAPP_DIGITS ? formatPhone(RAW_WHATSAPP) : '';

/** A wa.me link, optionally with a message already typed; null when WhatsApp isn't set up. */
export function whatsappUrl(message = '') {
  if (!WHATSAPP_DIGITS) return null;
  return `https://wa.me/${WHATSAPP_DIGITS}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
