/**
 * Admin call/WhatsApp links.
 *
 * This used to guess: strip "00", swap a leading "0" for "971", otherwise pass
 * the digits through untouched. A stored "501234567" therefore became
 * tel:+501234567 — Honduras — and a stored "+9710501234567" produced a wa.me
 * link that resolves to nobody. Both now go through the shared parser, which
 * returns null rather than a plausible-looking wrong number; every call site
 * already guards on a falsy value, so the button simply does not render.
 */
import { AlertTriangle } from 'lucide-react';
import { isValidPhone } from '@/lib/phone';

export { toWhatsApp as internationalPhone, formatPhone, toTel, parsePhone } from '@/lib/phone';

/**
 * Flags a stored number that cannot be read as a UAE number. Those rows exist
 * from before validation was added — typically a digit short — and they are
 * useless for delivery, so say so where staff will act on it.
 */
export function PhoneNeedsCheck({ phone }) {
  if (!phone || isValidPhone(phone, { requireMobile: false })) return null;
  return (
    <span
      className="inline-flex items-center gap-1 ml-1.5 align-middle"
      style={{ color: '#b45309', fontSize: 11, fontWeight: 600 }}
      title="This number is not a valid UAE number — it cannot be called or messaged. Ask the customer to confirm it."
    >
      <AlertTriangle size={11} />Check
    </span>
  );
}

