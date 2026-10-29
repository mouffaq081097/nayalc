import { orderableQty } from './backorderRules.js';
import { RITUAL_STEPS, ritualStepOf, byBest } from './ritualRules.js';

/**
 * Product-page suggestions from the catalogue AppContext already holds
 * (isomorphic). Real co-purchases come from the server (lib/boughtTogether.js);
 * these fill in honestly when there aren't enough orders yet.
 */

const n = (v) => Number(v);
const overlap = (list = [], set) => list.reduce((k, x) => k + (set.has(n(x)) ? 1 : 0), 0);
const sameBrand = (a, b) => !!a?.brand && a.brand === b?.brand;

/** The catalogue's copy of a product: it carries concern_ids, category_ids and live stock. */
export const catalogueCopy = (product, catalogue) => catalogue.find((p) => n(p.id) === n(product?.id)) || product;

/**
 * "You may also like": buyable products sharing the most skin concerns, then
 * collections, then the brand, best sellers first; topped up with best sellers.
 * `exclude` holds ids shown elsewhere (other sizes, the bought-together pair).
 */
export function relatedProducts(product, catalogue = [], { exclude = [], limit = 4 } = {}) {
  if (!product) return [];
  const me = catalogueCopy(product, catalogue);
  const concerns = new Set((me.concern_ids || []).map(n));
  const collections = new Set((me.category_ids || []).map(n));
  const skip = new Set([n(product.id), ...exclude.map(n)]);
  const pool = catalogue.filter((p) => !skip.has(n(p.id)) && orderableQty(p) > 0);
  const close = pool
    .map((p) => ({ p, score: overlap(p.concern_ids, concerns) * 3 + overlap(p.category_ids, collections) * 2 + (sameBrand(p, me) ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || byBest(a.p, b.p))
    .map((x) => x.p);
  const rest = pool.filter((p) => !close.includes(p)).sort(byBest);
  return [...close, ...rest].slice(0, limit);
}

/**
 * "Complete your routine": the best seller of each other ritual step
 * (lib/ritualRules.js), from the same brand when it has one. Empty when the
 * product isn't part of the ritual, so nothing is suggested without a reason.
 */
export function routineCompanions(product, catalogue = [], categories = [], { exclude = [] } = {}) {
  if (!product) return [];
  const me = catalogueCopy(product, catalogue);
  const step = ritualStepOf(me, categories);
  if (!step) return [];
  const skip = new Set([n(product.id), ...exclude.map(n)]);
  const pool = catalogue.filter((p) => !skip.has(n(p.id)) && orderableQty(p) > 0);
  return RITUAL_STEPS
    .filter((s) => s.key !== step)
    .map((s) => {
      const inStep = pool.filter((p) => ritualStepOf(p, categories) === s.key).sort(byBest);
      return inStep.find((p) => sameBrand(p, me)) || inStep[0];
    })
    .filter(Boolean);
}
