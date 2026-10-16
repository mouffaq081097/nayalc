import { round2, round4 } from './documents.js';

// Landed cost — what a received unit really cost us, in AED. Pure and isomorphic,
// so the GRN page previews exactly what finalizeCosting() will book.
//
//   base cost     supplier price × the GRN's exchange rate
//   + charges     freight, customs duty, bank/FX fees, other — each converted to
//                 AED at its own rate and spread over the accepted units, either
//                 by value (share of the base cost) or by quantity
//   = landed cost per unit
//
// Rejected units are never costed: they don't go on the shelf.

/**
 * @param lines   [{ key, quantity, unitPrice }]  quantity = accepted units, unitPrice in the PO currency
 * @param rate    AED per one unit of the PO currency (1 for AED)
 * @param charges [{ amount, exchangeRate, allocation: 'value' | 'quantity' }]
 * @returns { lines: [{ ...line, baseUnit, baseTotal, chargesTotal, landedTotal, landedUnit }], totals }
 */
export function costReceipt(lines, rate, charges = []) {
  const fx = Number(rate) > 0 ? Number(rate) : 0;
  const costed = lines.map(line => {
    const quantity = Math.max(0, parseInt(line.quantity, 10) || 0);
    const baseUnit = round4((Number(line.unitPrice) || 0) * fx);
    return { ...line, quantity, baseUnit, baseTotal: round2(baseUnit * quantity), chargesTotal: 0 };
  });
  const withUnits = costed.filter(l => l.quantity > 0);

  let chargesAed = 0;
  let unallocated = 0;
  for (const charge of charges) {
    const aed = chargeInAed(charge);
    chargesAed = round2(chargesAed + aed);
    if (aed === 0) continue;
    if (withUnits.length === 0) {
      unallocated = round2(unallocated + aed);
      continue;
    }
    // Free goods have no value to share by, so fall back to quantity
    const byValue = charge.allocation !== 'quantity' && withUnits.some(l => l.baseTotal > 0);
    const weight = (l) => (byValue ? l.baseTotal : l.quantity);
    const totalWeight = withUnits.reduce((s, l) => s + weight(l), 0);

    let given = 0;
    for (const line of withUnits) {
      const share = round2(aed * weight(line) / totalWeight);
      line.chargesTotal = round2(line.chargesTotal + share);
      given = round2(given + share);
    }
    // Rounding pennies go to the heaviest line so the charge is booked in full
    const heaviest = withUnits.reduce((a, b) => (weight(b) > weight(a) ? b : a));
    heaviest.chargesTotal = round2(heaviest.chargesTotal + (aed - given));
  }

  for (const line of costed) {
    line.landedTotal = round2(line.baseTotal + line.chargesTotal);
    line.landedUnit = line.quantity > 0 ? round4(line.landedTotal / line.quantity) : line.baseUnit;
  }

  const base = round2(costed.reduce((s, l) => s + l.baseTotal, 0));
  return {
    lines: costed,
    totals: {
      units: costed.reduce((s, l) => s + l.quantity, 0),
      base,
      charges: chargesAed,
      landed: round2(base + chargesAed - unallocated),
      unallocated,
    },
  };
}

export const chargeInAed = (charge) => round2((Number(charge.amount) || 0) * (Number(charge.exchangeRate) || 0));

/**
 * Weighted average cost after `quantity` units at `unitCost` join `stock` units
 * at `average`. With no known average, or nothing on the shelf, the new cost is
 * simply the incoming cost.
 */
export function blendAverage({ stock, average, quantity, unitCost }) {
  const onShelf = Math.max(0, Number(stock) || 0);
  if (average == null || onShelf === 0) return round4(unitCost);
  const total = onShelf + quantity;
  return total > 0 ? round4((onShelf * Number(average) + quantity * unitCost) / total) : round4(unitCost);
}
