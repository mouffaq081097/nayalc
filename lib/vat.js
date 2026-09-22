// UAE VAT — the one place the rate and the arithmetic live.
//
// Displayed prices are VAT-INCLUSIVE, which is what UAE consumer protection
// requires of a consumer-facing price. VAT is therefore never added to a total:
// it is extracted from it, for the tax record and for the tax invoice, which
// must still state the VAT amount even though the price included it.
//
// The taxable base is the whole consideration the customer actually pays —
// products, shipping and gift wrap, after any discount — because delivery is a
// taxable supply in the UAE, not an exempt add-on.

export const VAT_RATE = 0.05;

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/**
 * The VAT contained within a VAT-inclusive amount.
 * At 5%, that is gross × 5/105 — never gross × 5%.
 */
export function vatFromGross(gross) {
  return round2((Number(gross) || 0) * VAT_RATE / (1 + VAT_RATE));
}

/** The amount excluding VAT — what the business actually keeps. */
export function netFromGross(gross) {
  return round2((Number(gross) || 0) - vatFromGross(gross));
}

/** Turns a legacy VAT-exclusive figure into its inclusive equivalent. */
export function grossFromNet(net) {
  return round2((Number(net) || 0) * (1 + VAT_RATE));
}
