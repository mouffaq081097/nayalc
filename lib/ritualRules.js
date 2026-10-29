import { orderableQty } from './backorderRules.js';

/**
 * The skincare ritual in the words of the homepage's GERnétic banner:
 * Cleanse → Treat → Protect. Isomorphic (homepage, product page, admin).
 *
 * A product's step comes from, in order:
 *   1. a step set on one of its collections (Admin → Collections → Ritual step,
 *      `categories.ritual_step`, lib/ritualSteps.js),
 *   2. words in its name ("Cleansing Milk" → cleanse, "Eye Gel" → treat),
 *   3. words in its collections' names, then its texture (`form`).
 * Body, hair and hand care, perfumes and gift sets are never part of it.
 */

export const RITUAL_STEPS = [
  { key: 'cleanse', label: 'Cleanse' },
  { key: 'treat', label: 'Treat' },
  { key: 'protect', label: 'Protect' },
];
export const STEP_KEYS = RITUAL_STEPS.map((s) => s.key);
/** Stored values of `categories.ritual_step`; NULL means "work it out from the names". */
export const STEP_SETTINGS = [...STEP_KEYS, 'none'];

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Checked in this order, so "Cleansing Gel" is a cleanser and "Eye Cream" a treatment
const RULES = [
  ['none', /\b(body|corps|hair|cheveux|scalp|hand|hands|mains|foot|feet|pieds|nail|ongles|lip|lips|levres|shower|douche|bath|bain|deodorant|parfum|perfume|fragrance|eau de|oud|musk|coffret|gift|kit|set|bundle|candle|bougie)\b/],
  ['cleanse', /\b(cleans\w*|cleaner|demaquill\w*|nettoy\w*|make-?up remov\w*|micellar|micellaire|wash|foam\w*|mousse|milk|lait|toner|tonic|tonique|lotion|exfoli\w*|scrub|gommage|peel\w*)\b/],
  ['treat', /\b(serum|serums|concentrat\w*|ampoules?|booster|treatment|traitement|soin intensif|eye|eyes|yeux|contour|mask|masks|masque|gel|oil|huile|elixir|essence|spot|patch|repair\w*|anti-?\w+)\b/],
  ['protect', /\b(cream|creams|creme|cremes|moistur\w*|hydrat\w*|emulsion|fluid|fluide|balm|baume|spf|sun|solaire|protect\w*|day|jour|night|nuit)\b/],
];

/** The step words in a name or label suggest, or null. 'none' = never part of the ritual. */
export function suggestRitualStep(text) {
  const words = fold(text);
  if (!words.trim()) return null;
  for (const [step, re] of RULES) if (re.test(words)) return step;
  return null;
}

const ids = (list) => (list || []).map(Number);

/**
 * The ritual step of a catalogue product (AppContext shape: category_ids, name, form),
 * or null when it isn't part of the ritual.
 */
export function ritualStepOf(product, categories = []) {
  if (!product) return null;
  const mine = categories.filter((c) => ids(product.category_ids).includes(Number(c.id)));
  const set = mine.map((c) => c.ritualStep).filter((s) => STEP_SETTINGS.includes(s));
  const chosen = set.find((s) => s !== 'none');
  if (chosen) return chosen;
  if (set.includes('none')) return null;
  const guess = suggestRitualStep(product.name)
    || mine.map((c) => suggestRitualStep(c.name)).find(Boolean)
    || suggestRitualStep(product.form);
  return guess && guess !== 'none' ? guess : null;
}

export const byBest = (a, b) =>
  (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0));

/**
 * Each step's buyable products, best sellers first. `brandMatch(product)` limits
 * the ritual to one range (the homepage uses GERnétic). Null unless every step
 * has at least one product.
 */
export function buildRitual(products = [], categories = [], brandMatch = () => true) {
  const steps = RITUAL_STEPS.map((step) => ({
    ...step,
    products: products
      .filter((p) => orderableQty(p) > 0 && brandMatch(p) && ritualStepOf(p, categories) === step.key)
      .sort(byBest),
  }));
  return steps.every((s) => s.products.length) ? steps : null;
}
