// Shipping tiers — quantity-based (not value-based)
// Shipped through OTO (lib/oto.js): our courier partners quote about AED 12–16 a parcel
//
// These are VAT-INCLUSIVE, like every other price on the site. Delivery is a
// taxable supply in the UAE, so VAT is extracted from the whole order, this
// charge included: AED 21 nets AED 20, and AED 10.50 nets AED 10 — the same
// as the exclusive figures these replaced.
export const SHIPPING_TIERS = [
  { minItems: 1, maxItems: 1, cost: 21, label: '1 item'  },
  { minItems: 2, maxItems: 2, cost: 10.5, label: '2 items' },
  { minItems: 3, maxItems: Infinity, cost: 0, label: '3+ items' },
];

/**
 * Shipping shown the way a price should read: decimals only when they carry
 * meaning, so 21 renders as "AED 21" and 10.5 as "AED 10.50", never "AED 10.5".
 */
export const formatShipping = (cost) =>
  Number(cost) === 0
    ? 'Free'
    : `AED ${Number.isInteger(Number(cost)) ? Number(cost) : Number(cost).toFixed(2)}`;

// Artisan Gift — spend-based bonus to promote the handmade collection
export const ARTISAN_GIFT_THRESHOLD = 280;
export const ARTISAN_GIFT_NAME = 'Lumière Artisan Gift';

export function calcShipping(totalQty) {
  if (totalQty <= 0) return 0;
  if (totalQty >= 3) return 0;
  if (totalQty >= 2) return 10.5;
  return 21;
}

// Returns what the customer needs to do to reach cheaper/free shipping
// null = already free
export function nextShippingTier(totalQty) {
  if (totalQty >= 3) return null;
  if (totalQty === 2) return { itemsNeeded: 1, newCost: 0,    saving: 10.5 };
  return                        { itemsNeeded: 1, newCost: 10.5, saving: 10.5 };
}

// Order cutoff: 2 PM UAE time (GMT+4) — most OTO couriers collect until 14:00.
// Before cutoff the parcel is dispatched today.
const CUTOFF_HOUR_UAE = 14;

// What OTO's couriers quote from our Umm Al Quwain warehouse: 1–3 working days
// after dispatch. The range is shown rather than the best case, so the customer
// is never promised a day the courier didn't.
const TRANSIT_DAYS_MIN = 1;
const TRANSIT_DAYS_MAX = 3;
export const TRANSIT_LABEL = `${TRANSIT_DAYS_MIN}–${TRANSIT_DAYS_MAX} working days`;
export const TRANSIT_SHORT_LABEL = `${TRANSIT_DAYS_MIN}–${TRANSIT_DAYS_MAX} day delivery`;

// The item count where shipping becomes free
export const FREE_SHIPPING_FROM = SHIPPING_TIERS.find((t) => t.cost === 0)?.minItems ?? 3;

function addBizDays(fromDate, n) {
  const d = new Date(fromDate);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

// Returns delivery info based on UAE time cutoff.
// Before 2 PM UAE → dispatched today, arrives 1–3 working days later + countdown minutes
// After  2 PM UAE → dispatched the next working day, then 1–3 working days
export function getDeliveryInfo() {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Everything anchored to the current UAE wall-clock date/time, not the server's
  // own timezone, so the cutoff and the business-day math never drift near midnight.
  const nowUAE   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const uaeHour  = nowUAE.getHours();
  const uaeMin   = nowUAE.getMinutes();

  // Nothing is dispatched at the weekend, so there's no same-day cutoff to race then
  const isWorkingDay = nowUAE.getDay() !== 0 && nowUAE.getDay() !== 6;
  const beforeCutoff = isWorkingDay && uaeHour < CUTOFF_HOUR_UAE;
  const daysToAdd    = beforeCutoff ? TRANSIT_DAYS_MIN : TRANSIT_DAYS_MIN + 1;
  const delivery     = addBizDays(nowUAE, daysToAdd);
  const latest       = addBizDays(delivery, TRANSIT_DAYS_MAX - TRANSIT_DAYS_MIN);

  const fmt = d => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  // Minutes remaining until 2 PM cutoff (only relevant when before cutoff)
  const minsLeft = beforeCutoff
    ? (CUTOFF_HOUR_UAE - uaeHour - 1) * 60 + (60 - uaeMin)
    : null;

  // Calendar-accurate "today"/"tomorrow" wording — only used when actually true
  // (a Friday order can land on Monday, which is never "tomorrow"), else falls
  // back to the explicit weekday + date.
  const dayOf = d => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  const diffDays = dayOf(delivery) - dayOf(nowUAE);
  const relativeLabel = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : fmt(delivery);

  // "Tue 14 – Thu 16 Oct", or "Fri 30 Oct – Tue 3 Nov" across a month end
  const sameMonth = delivery.getMonth() === latest.getMonth();
  const rangeLabel = `${DAYS[delivery.getDay()]} ${delivery.getDate()}${sameMonth ? '' : ` ${MONTHS[delivery.getMonth()]}`} – ${DAYS[latest.getDay()]} ${latest.getDate()} ${MONTHS[latest.getMonth()]}`;

  return {
    dateLabel:    fmt(delivery),
    relativeLabel,                     // 'today' | 'tomorrow' | 'Wed, 10 Sep'
    deliveryDate: delivery,          // earliest arrival
    latestDate:   latest,            // latest arrival
    rangeLabel,                      // 'Tue 14 – Thu 16 Oct'
    transitLabel: TRANSIT_LABEL,
    isNextDay:    beforeCutoff,
    minsLeft,                         // null when past cutoff
    cutoffLabel:  '2:00 PM',
  };
}
