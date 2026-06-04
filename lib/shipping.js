// Shipping tiers — quantity-based (not value-based)
// Actual shipment cost: ~AED 32 via Fly Express
export const SHIPPING_TIERS = [
  { minItems: 1, maxItems: 1, cost: 20, label: '1 item'  },
  { minItems: 2, maxItems: 2, cost: 10, label: '2 items' },
  { minItems: 3, maxItems: Infinity, cost: 0, label: '3+ items' },
];

// Artisan Gift — spend-based bonus to promote the handmade collection
export const ARTISAN_GIFT_THRESHOLD = 280;
export const ARTISAN_GIFT_NAME = 'Lumière Artisan Gift';

export function calcShipping(totalQty) {
  if (totalQty <= 0) return 0;
  if (totalQty >= 3) return 0;
  if (totalQty >= 2) return 10;
  return 20;
}

// Returns what the customer needs to do to reach cheaper/free shipping
// null = already free
export function nextShippingTier(totalQty) {
  if (totalQty >= 3) return null;
  if (totalQty === 2) return { itemsNeeded: 1, newCost: 0,  saving: 10 };
  return                        { itemsNeeded: 1, newCost: 10, saving: 10 };
}

// Order cutoff: 2 PM UAE time (GMT+4). Before cutoff = next business day delivery.
const CUTOFF_HOUR_UAE = 14;

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
// Before 2 PM UAE → "tomorrow, Day D Mon" + countdown minutes
// After  2 PM UAE → "Day D Mon" (next business day after tomorrow)
export function getDeliveryInfo() {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const nowUAE   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const uaeHour  = nowUAE.getHours();
  const uaeMin   = nowUAE.getMinutes();

  const beforeCutoff = uaeHour < CUTOFF_HOUR_UAE;
  const daysToAdd    = beforeCutoff ? 1 : 2;
  const delivery     = addBizDays(new Date(), daysToAdd);

  const fmt = d => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  // Minutes remaining until 2 PM cutoff (only relevant when before cutoff)
  const minsLeft = beforeCutoff
    ? (CUTOFF_HOUR_UAE - uaeHour - 1) * 60 + (60 - uaeMin)
    : null;

  return {
    dateLabel:    fmt(delivery),
    isNextDay:    beforeCutoff,
    minsLeft,                         // null when past cutoff
    cutoffLabel:  '2:00 PM',
  };
}
