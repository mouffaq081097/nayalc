// Courier names and tracking links. No dependencies, so the emails, the API
// and the account pages all show the same thing.

// Couriers we can build a tracking link for from the tracking number alone.
// Our own UAE/English link wins over a stored one (OTO sends Aramex's Saudi, Arabic page).
const COURIERS = [
  { match: /aramex/i, label: 'Aramex', url: (n) => `https://www.aramex.com/ae/en/track/results?mode=0&ShipmentNumber=${n}` },
  { match: /\bdhl\b/i, label: 'DHL', url: (n) => `https://www.dhl.com/ae-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}` },
  { match: /fed\s*ex/i, label: 'FedEx', url: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}` },
  { match: /\bups\b/i, label: 'UPS', url: (n) => `https://www.ups.com/track?tracknum=${n}` },
  { match: /smsa/i, label: 'SMSA Express' },
  { match: /emirates\s*post/i, label: 'Emirates Post' },
];

const findCourier = (name) => COURIERS.find((c) => c.match.test(String(name || '')));

const titleCase = (s) => s.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase());

/** "aramex" → "Aramex"; unknown names are trimmed and title-cased; '' when there is none. */
export function courierLabel(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  return findCourier(raw)?.label || titleCase(raw.toLowerCase());
}

const isWebUrl = (url) => /^https?:\/\/\S+$/i.test(String(url || '').trim());

/**
 * The link a customer follows to track the parcel: built from the tracking number for
 * couriers we know, otherwise the link saved on the order. null when there is neither.
 */
export function trackingUrl({ courierName, trackingNumber, courierWebsite } = {}) {
  const number = String(trackingNumber || '').trim();
  const courier = findCourier(courierName);
  if (courier?.url && number) return courier.url(encodeURIComponent(number));
  return isWebUrl(courierWebsite) ? String(courierWebsite).trim() : null;
}
