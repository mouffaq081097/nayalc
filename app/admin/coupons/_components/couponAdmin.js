// Shared helpers for the admin discount list and discount editor

const DUBAI_TZ = 'Asia/Dubai';

export const isValidCode = (code) => /^[A-Za-z0-9_-]{3,32}$/.test(code);

// "YYYY-MM-DD" of a moment in UAE time, for <input type="date">
export const toDubaiDateInput = (value) => (value
  ? new Intl.DateTimeFormat('en-CA', { timeZone: DUBAI_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
  : '');

// The last second of a chosen day in UAE time (UTC+4, no daylight saving)
export const endOfDubaiDay = (dateInput) => new Date(`${dateInput}T23:59:59+04:00`).toISOString();

export const fmtDubaiDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: DUBAI_TZ })
  : '');

export function daysUntil(value) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

export function couponStatus(coupon) {
  if (coupon.is_active === false) return { id: 'disabled', label: 'Disabled', cls: 'sp-badge-neutral' };
  if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) return { id: 'expired', label: 'Expired', cls: 'sp-badge-neutral' };
  if (coupon.usage_limit != null && Number(coupon.usage_count) >= Number(coupon.usage_limit)) {
    return { id: 'limit', label: 'Limit reached', cls: 'sp-badge-warning' };
  }
  return { id: 'active', label: 'Active', cls: 'sp-badge-success' };
}

export function discountLabel(type, value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'No value yet';
  return type === 'percentage' ? `${Number(amount.toFixed(2))}% off` : `AED ${amount.toFixed(2)} off`;
}

// Plain-language description of what a code does
export function couponSummary(coupon) {
  const hasValue = Number(coupon.discount_value) > 0;
  return [
    hasValue ? `${discountLabel(coupon.discount_type, coupon.discount_value)} the order subtotal` : 'No discount value yet',
    coupon.minimum_purchase_amount ? `Minimum subtotal of AED ${Number(coupon.minimum_purchase_amount).toFixed(2)}` : 'No minimum purchase',
    coupon.usage_limit ? `Limited to ${coupon.usage_limit} use${Number(coupon.usage_limit) !== 1 ? 's' : ''}` : 'No usage limit',
    coupon.expiration_date ? `Ends ${fmtDubaiDate(coupon.expiration_date)}` : 'No end date',
  ];
}

// Easy-to-read random code: no 0/O or 1/I/L look-alikes
export function generateCode(length = 8) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), b => alphabet[b % alphabet.length]).join('');
}
