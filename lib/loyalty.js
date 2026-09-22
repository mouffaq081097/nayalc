// Lumière Prestige — the one place the loyalty economics are defined.
// Checkout, the order API, the delivery credit and the account pages all read
// from here, so the rate can never drift between what a customer is shown and
// what they are actually given.

// ── Earning ───────────────────────────────────────────────────────────────
// 1 point per AED 5 of product subtotal. Paired with the redemption rate
// below that is 1% back at Silver, rising to 2% at Diamond.
//
// Points are earned on the product subtotal only — never on the 5% VAT we
// remit to the government, nor on shipping we don't profit from.
export const AED_PER_POINT = 5;

// ── Redemption ────────────────────────────────────────────────────────────
// Deliberately unchanged from the original scheme: balances customers already
// hold keep exactly the value they were promised. Only the earn rate moved.
export const POINTS_BLOCK = 100;
export const AED_PER_BLOCK = 5;

// ── Welcome bonus ─────────────────────────────────────────────────────────
// Credited when a member's first order is DELIVERED, not at signup — an
// account on its own earns nothing, so the bonus costs us only where there is
// a real customer behind it.
export const WELCOME_BONUS_POINTS = 200;
export const WELCOME_BONUS_DESCRIPTION = 'Welcome to Lumière Prestige — first order delivered';

// ── Tiers ─────────────────────────────────────────────────────────────────
// `min` is lifetime spend in AED.
export const TIERS = [
  { name: 'Silver',   min: 0,     multiplier: 1    },
  { name: 'Gold',     min: 2000,  multiplier: 1.25 },
  { name: 'Platinum', min: 5000,  multiplier: 1.5  },
  { name: 'Diamond',  min: 10000, multiplier: 2    },
];

/** The tier a given lifetime spend qualifies for. */
export function tierForSpend(lifetimeSpend) {
  const spend = Number(lifetimeSpend) || 0;
  let tier = TIERS[0];
  for (const t of TIERS) if (spend >= t.min) tier = t;
  return tier;
}

/** Earn multiplier for a tier name, defaulting to the base rate. */
export function tierMultiplier(tierName) {
  return (TIERS.find(t => t.name === tierName) || TIERS[0]).multiplier;
}

/**
 * Points earned for an order.
 * @param subtotal product subtotal in AED, excluding VAT, shipping and gift wrap
 * @param tierName the member's tier at the time the order is credited
 */
export function pointsForOrder(subtotal, tierName) {
  const base = (Number(subtotal) || 0) / AED_PER_POINT;
  return Math.max(0, Math.floor(base * tierMultiplier(tierName)));
}

/** AED a balance is worth, rounded down to whole redeemable blocks. */
export function pointsToAed(points) {
  return Math.floor((Number(points) || 0) / POINTS_BLOCK) * AED_PER_BLOCK;
}

/** The largest slice of a balance that can actually be redeemed. */
export function redeemablePoints(points) {
  return Math.floor((Number(points) || 0) / POINTS_BLOCK) * POINTS_BLOCK;
}
