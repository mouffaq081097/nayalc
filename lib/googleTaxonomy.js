/**
 * Google's product taxonomy (version 2021-09-21, the latest Google publishes),
 * the part this shop sells in. Merchant Center reads `g:google_product_category`
 * as one of these ids. Isomorphic: the feed, Admin → SEO and the editors.
 *
 * A product's category comes from, in order (resolveGoogleCategory below):
 *   1. the product's own choice (Admin → Products → Google Merchant),
 *   2. its name ("Cleansing Milk" → Facial Cleansers) when that sits inside
 *      what its collection says, or when no collection says anything,
 *   3. its collections (Admin → Collections → Google product category; a
 *      collection without one uses its parent's),
 *   4. its brand: perfumes → Perfume & Cologne, everything else → Skin Care.
 */

// [id, full path]. Only ids from Google's file: Merchant Center rejects anything else.
const ROWS = [
  [473, 'Health & Beauty > Personal Care > Cosmetics'],
  [567, 'Health & Beauty > Personal Care > Cosmetics > Skin Care'],
  [2526, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Cleansers'],
  [6034, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Makeup Removers'],
  [5976, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Toners & Astringents'],
  [543658, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Toners & Astringents > Toners'],
  [2592, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotion & Moisturizer'],
  [6262, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Skin Care Masks & Peels'],
  [8029, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Compressed Skin Care Mask Sheets'],
  [481, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Acne Treatments & Kits'],
  [7429, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Anti-Aging Skin Care Kits'],
  [7467, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Cleansing Kits'],
  [2844, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Sunscreen'],
  [6104, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Body Oil'],
  [5980, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Body Powder'],
  [482, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lip Balms & Treatments'],
  [543573, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lip Balms & Treatments > Lip Balms'],
  [2740, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Tanning Products'],
  [5338, 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Tanning Products > Self Tanner'],
  [479, 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne'],
  [474, 'Health & Beauty > Personal Care > Cosmetics > Bath & Body'],
  [2747, 'Health & Beauty > Personal Care > Cosmetics > Bath & Body > Body Wash'],
  [2503, 'Health & Beauty > Personal Care > Cosmetics > Bath & Body > Bar Soap'],
  [2522, 'Health & Beauty > Personal Care > Cosmetics > Bath & Body > Bath Additives'],
  [475, 'Health & Beauty > Personal Care > Cosmetics > Bath & Body Gift Sets'],
  [6069, 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Sets'],
  [477, 'Health & Beauty > Personal Care > Cosmetics > Makeup'],
  [478, 'Health & Beauty > Personal Care > Cosmetics > Nail Care'],
  [3009, 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Cuticle Cream & Oil'],
  [2958, 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Skin Care Tools'],
  [486, 'Health & Beauty > Personal Care > Hair Care'],
  [2441, 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner'],
  [543615, 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner > Shampoo'],
  [543616, 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner > Conditioners'],
  [4766, 'Health & Beauty > Personal Care > Hair Care > Hair Loss Treatments'],
  [1901, 'Health & Beauty > Personal Care > Hair Care > Hair Styling Products'],
  [8452, 'Health & Beauty > Personal Care > Hair Care > Hair Care Kits'],
  [484, 'Health & Beauty > Personal Care > Deodorant & Anti-Perspirant'],
  [5664, 'Health & Beauty > Personal Care > Massage & Relaxation > Massage Oil'],
  [2915, 'Health & Beauty > Personal Care'],
  [525, 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements'],
  [592, 'Home & Garden > Decor > Home Fragrances'],
  [588, 'Home & Garden > Decor > Home Fragrances > Candles'],
  [3686, 'Home & Garden > Decor > Home Fragrances > Incense'],
  [5847, 'Home & Garden > Decor > Home Fragrances > Fragrance Oil'],
];

/** { id, path, label } — label is the path after "Personal Care >" (or after "Decor >"), short enough for a menu. */
export const GOOGLE_CATEGORIES = ROWS.map(([id, path]) => ({
  id,
  path,
  label: path.replace(/^Health & Beauty > Personal Care > (Cosmetics > )?/, '').replace(/^Home & Garden > Decor > /, '') || path,
}));

const BY_ID = new Map(GOOGLE_CATEGORIES.map((c) => [c.id, c]));

export const SKIN_CARE = 567;
export const PERFUME = 479;

/** The category for an id (number or numeric string), or null when it isn't one of ours. */
export function googleCategory(id) {
  const n = Number(id);
  return Number.isInteger(n) ? BY_ID.get(n) || null : null;
}

/** A stored or posted value as kept in the database: a known id, or null. */
export const parseGoogleCategoryId = (value) => googleCategory(value)?.id ?? null;

/** True when `id` is `parent` or sits under it ("Facial Cleansers" is within "Skin Care"). */
export function isWithin(id, parent) {
  const a = googleCategory(id);
  const b = googleCategory(parent);
  return !!a && !!b && (a.path === b.path || a.path.startsWith(`${b.path} > `));
}

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Checked in this order, so "Cleansing Gel" is a cleanser and "Body Cream" a moisturiser
const RULES = [
  [588, /\b(candles?|bougies?)\b/],
  [3686, /\b(incense|bakhoor|bukhoor|bakhour)\b/],
  [592, /\b(home fragrances?|room spray|diffusers?|reed)\b/],
  [PERFUME, /\b(perfumes?|parfums?|fragrances?|eau de|cologne|oud|musk|attar|body mist|extrait)\b/],
  [6069, /\b(gift sets?|coffrets?|kits?|sets?|duo|trio|discovery box|routine box)\b/],
  [2844, /\b(sunscreen|spf ?\d*|sun cream|sun care|solaire|sun protect\w*)\b/],
  [543615, /\b(shampoo|shampooing)\b/],
  [543616, /\b(conditioner|apres-shampo\w*)\b/],
  [4766, /\b(hair loss|anti-chute|chute)\b/],
  [486, /\b(hair|cheveux|scalp|capillaire|capi)\b/],
  [6034, /\b(make-?up remov\w*|demaquill\w*|micellar|micellaire)\b/],
  [2526, /\b(cleans\w*|cleaner|nettoy\w*|face wash|facial wash|foaming|cleansing milk|lait)\b/],
  [543658, /\b(toners?|tonics?|tonique|toning)\b/],
  [6262, /\b(masks?|masque|peel\w*|gommage|exfoli\w*|scrub)\b/],
  [482, /\b(lips?|levres|lip balm)\b/],
  [6104, /\b(body oil|dry oil|huile seche|huile corps)\b/],
  [5664, /\b(massage)\b/],
  [474, /\bbath (&|and) body\b/],
  [2747, /\b(shower|body wash|gel douche|douche)\b/],
  [2503, /\b(soap|savon)\b/],
  [2522, /\b(bath salts?|bath|bain)\b/],
  [484, /\b(deodorant|deo)\b/],
  [3009, /\b(cuticle)\b/],
  [478, /\b(nails?|ongles)\b/],
  [481, /\b(acne|blemish\w*|spot treatment)\b/],
  [SKIN_CARE, /\b(serums?|concentrat\w*|ampoules?|booster|elixir|essence)\b/],
  [2592, /\b(creams?|cremes?|moistur\w*|hydrat\w*|emulsion|fluids?|fluide|balms?|baume|lotion|body butter|beurre)\b/],
  [SKIN_CARE, /\b(eye|eyes|yeux|contour|gel|oil|huile|face|visage|skin|peau|skincare|soin\w*|anti-?\w+)\b/],
  [525, /\b(supplements?|vitamins?|capsules?|gummies)\b/],
];

// "Fragrance-free cream" is not a perfume
const NOT_SCENT = /\b(fragrance|parfum|perfume)[- ]free\b|\bsans parfum\b|\bunscented\b|\bwithout fragrance\b/g;

/** The category a product name, form or collection name suggests, or null. */
export function suggestGoogleCategory(text) {
  const words = fold(text).replace(NOT_SCENT, ' ');
  if (!words.trim()) return null;
  for (const [id, re] of RULES) if (re.test(words)) return id;
  return null;
}

const isPerfumeBrand = (brand) => /perfume|parfum/i.test(brand || '');

/**
 * A collection's own category, else its parent's (up the tree), else null.
 * `byId` maps category id → { id, parentId, googleCategoryId }.
 */
export function collectionGoogleCategory(category, byId) {
  const seen = new Set();
  let c = category;
  while (c && !seen.has(c.id)) {
    seen.add(c.id);
    const own = parseGoogleCategoryId(c.googleCategoryId);
    if (own) return own;
    c = c.parentId ? byId.get(Number(c.parentId)) : null;
  }
  return null;
}

/** The deeper path wins: "Skin Care > Facial Cleansers" says more than "Skin Care". */
const deeper = (a, b) => ((googleCategory(b)?.path.split(' > ').length || 0) > (googleCategory(a)?.path.split(' > ').length || 0) ? b : a);

/**
 * The Google category a product is listed under, and why:
 *   { id, source: 'product' | 'name' | 'collection' | 'brand', collection?: name }.
 * `product` needs name, form, brand (or brandName) and google_category_id;
 * `collections` are the product's own categories ({ id, name, parentId, googleCategoryId });
 * `byId` maps every category id to its row, for the parents.
 */
export function resolveGoogleCategory(product, collections = [], byId = new Map()) {
  const own = parseGoogleCategoryId(product.google_category_id ?? product.googleCategoryId);
  if (own) return { id: own, source: 'product' };

  // What each of its collections says (a collection without a category asks its parent)
  const fromCollections = collections
    .map((c) => ({ id: collectionGoogleCategory(c, byId), name: c.name }))
    .filter((c) => c.id);

  // The name is more precise ("Night Cream" → Lotion & Moisturizer), but a collection can overrule it:
  // the name counts only when it sits inside one of the collections' categories, or when none has one
  const fromName = suggestGoogleCategory(`${product.name || ''} ${product.form || ''}`);
  if (fromName && (!fromCollections.length || fromCollections.some((c) => isWithin(fromName, c.id)))) {
    return { id: fromName, source: 'name' };
  }
  if (fromCollections.length) {
    const best = fromCollections.reduce((a, b) => (deeper(a.id, b.id) === b.id && b.id !== a.id ? b : a));
    return { id: best.id, source: 'collection', collection: best.name };
  }
  return { id: isPerfumeBrand(product.brand || product.brandName) ? PERFUME : SKIN_CARE, source: 'brand' };
}

/** Plain words for where a category came from, for the admin. */
export function sourceLabel(resolved) {
  switch (resolved?.source) {
    case 'product': return 'Chosen for this product';
    case 'name': return 'From the product name';
    case 'collection': return resolved.collection ? `From the ${resolved.collection} collection` : 'From its collection';
    default: return 'Default for the brand';
  }
}

/** "Skincare > Face care": the collection's place in the tree, top first, for g:product_type. */
export function collectionPath(category, byId) {
  const names = [];
  const seen = new Set();
  let c = category;
  while (c && !seen.has(c.id) && names.length < 5) {
    seen.add(c.id);
    names.unshift(c.name);
    c = c.parentId ? byId.get(Number(c.parentId)) : null;
  }
  return names.join(' > ');
}

/** The product's deepest collection path (ties: the first collection), or ''. */
export function productTypePath(collections = [], byId = new Map()) {
  let best = '';
  for (const c of collections) {
    const path = collectionPath(c, byId);
    if (path.split(' > ').length > best.split(' > ').filter(Boolean).length) best = path;
  }
  return best;
}
