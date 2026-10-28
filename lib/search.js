/**
 * Catalogue search shared by the header search panel and /search. Pure and
 * isomorphic: it works on the product list AppContext already holds.
 *
 * Matching ignores accents, capitals and punctuation ("lumiere" finds
 * "Lumière", "anti aging" finds "Anti-Aging"), looks at skin concerns and
 * collections as well as names, and falls back to close spellings
 * ("gernetik") only when nothing matches exactly.
 */

// Words that carry no meaning on their own in a shopping search
const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'for', 'with', 'of', 'to', 'in', 'on', 'my', 'by']);
// Too generic to pick a concern or collection on their own ("dry skin" → Dryness)
const GENERIC = new Set(['skin', 'care', 'skincare', 'product', 'products', 'cream', 'face']);

/** Lowercase, accent-free, punctuation-free text: "GERnétic — Anti-Âge" → "gernetic anti age". */
export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')          // Latin accents
    .replace(/[ً-ٰٟـ]/g, '') // Arabic short vowels and tatweel
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim();
}

/** The words a query is made of, minus filler words. */
export function queryTokens(query) {
  const words = fold(query).split(' ').filter(Boolean);
  const meaningful = words.filter((w) => !STOPWORDS.has(w));
  return meaningful.length ? meaningful : words;
}

// "serums" should find "serum", "creams" → "cream"
const variants = (token) => (token.length > 3 && token.endsWith('s') ? [token, token.slice(0, -1)] : [token]);
const hasToken = (text, token) => variants(token).some((v) => text.includes(v));

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// A close spelling of one of the words in `text` (one slip for short words, two for long ones)
function nearToken(text, token) {
  if (token.length < 4) return false;
  const max = token.length >= 8 ? 2 : 1;
  return text.split(' ').some((word) => word.length >= 3 && editDistance(token, word, max) <= max);
}

const FIELD_WEIGHTS = { name: 6, brand: 4, tags: 3, meta: 2, body: 1 };

/** The searchable text of one product, folded once. */
function productFields(p, concernNames) {
  const concerns = (p.concern_ids || []).map((id) => concernNames.get(Number(id))).filter(Boolean);
  return {
    name: fold(p.name),
    brand: fold(p.brandName || p.brand),
    tags: fold([p.categoryNames, ...concerns].join(' ')),
    meta: fold([p.size, p.form].join(' ')),
    body: fold([p.description, p.benefits].join(' ')),
  };
}

function scoreProduct(fields, tokens, phrase, near) {
  // Generic words ("skin", "cream") only count when they match; "dry skin" still finds Dryness products
  const required = tokens.some((t) => !GENERIC.has(t));
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const text = fields[field];
      if (!text) continue;
      if (hasToken(text, token)) best = Math.max(best, weight);
      else if (near && field !== 'body' && nearToken(text, token)) best = Math.max(best, weight / 2);
    }
    if (!best) {
      if (required && GENERIC.has(token)) continue;
      return 0; // every meaningful word has to match somewhere
    }
    score += best;
  }
  if (phrase && fields.name.includes(phrase)) score += 5;
  return score;
}

const isBuyable = (p) => {
  const stock = Number(p.stock_quantity ?? p.stockQuantity ?? 0);
  return stock > 0 || Number(p.backorderable || 0) > 0;
};

/**
 * Search the catalogue.
 * @returns {{ products: object[], concerns: object[], collections: object[], brands: object[], close: boolean }}
 *   `close` is true when the results come from close spellings rather than exact words.
 */
export function searchCatalog(products = [], query = '', { concerns = [], categories = [], brands = [], limit } = {}) {
  const tokens = queryTokens(query);
  const empty = { products: [], concerns: [], collections: [], brands: [], close: false };
  if (!tokens.length) return empty;
  const phrase = tokens.join(' ');

  const concernNames = new Map(concerns.map((c) => [Number(c.id), c.name]));
  const fields = products.map((p) => productFields(p, concernNames));

  const run = (near) => products
    .map((p, i) => ({ p, score: scoreProduct(fields[i], tokens, phrase, near) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => (b.score - a.score)
      || (Number(isBuyable(b.p)) - Number(isBuyable(a.p)))
      || (Number(!!b.p.isBestseller) - Number(!!a.p.isBestseller))
      || (Number(b.p.totalSold || 0) - Number(a.p.totalSold || 0)))
    .map((r) => r.p);

  let found = run(false);
  let close = false;
  if (!found.length) {
    found = run(true);
    close = found.length > 0;
  }

  // Concerns, collections and brands whose name holds the meaningful words of the query
  const specific = tokens.filter((t) => !GENERIC.has(t));
  const named = (list) => (specific.length
    ? list.filter((item) => { const name = fold(item.name); return specific.every((t) => hasToken(name, t)); })
    : []);

  return {
    products: limit ? found.slice(0, limit) : found,
    concerns: named(concerns),
    collections: named(categories.filter((c) => !c.parentId && c.isActive !== false)),
    brands: named(brands),
    close,
  };
}
