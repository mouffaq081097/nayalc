// Helpers shared by what search engines read: product page metadata, JSON-LD and the Merchant Center feed.

export const SITE = 'https://nayalc.com';
// The store's Instagram — the footer, the Instagram strip and the Organization JSON-LD all use this
export const INSTAGRAM_URL = 'https://www.instagram.com/nayalc';

// "GERnétic International" → "GERnétic": the short brand is what people search, and titles get cut at ~60 characters
export const shortBrand = (brand) => (brand || '').replace(/\s+International$/i, '').trim();

// Descriptions are stored with HTML and line breaks in places; search engines want plain text
export const plainText = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const fold = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// "Synchro Face Care" by GERnétic → "GERnétic Synchro Face Care"; a name that already carries the brand
// (accents aside) stays as it is, and "GLYCO by Gernetic: Nourishing Milk" → "GERnétic GLYCO Nourishing Milk"
export const productTitle = (name, brand) => {
  const short = shortBrand(brand);
  const base = String(name || '').replace(/\s+by\s+gern[eé]tic\s*:?\s*/i, ' ').replace(/\s+/g, ' ').trim();
  return short && !fold(base).includes(fold(short)) ? `${short} ${base}` : base;
};

export const productUrl = (product) => `${SITE}/product/${product.slug || product.id}`;

export const STORE_NAME = 'Naya Lumière Cosmetics';
// What Google shows before cutting a result off with "…"
export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT = 160;

// The page title when Admin → Products → Search engine listing is left empty
export const autoSeoTitle = (product) => `${productTitle(product.name || '', product.brand)} | Buy in UAE | ${STORE_NAME}`;

// The meta description when none is written: the short description, padded with who sells it when short
export function autoSeoDescription(product) {
  const short = plainText(product.description);
  const brand = product.brand ? `${product.brand} ` : '';
  const text = short.length < 100
    ? `Buy ${brand}${product.name || ''} online in the UAE. ${short} Authentic luxury skincare & beauty products at ${STORE_NAME}.`
    : short;
  return text.replace(/\s+/g, ' ').trim().slice(0, SEO_DESCRIPTION_LIMIT);
}

/** The title and description a product page uses: the admin's when written (seo_title / seo_description), else automatic. */
export function productSeo(product) {
  const title = (product.seo_title || product.seoTitle || '').trim();
  const description = (product.seo_description || product.seoDescription || '').trim();
  return {
    title: title || autoSeoTitle(product),
    description: description || autoSeoDescription(product),
    customTitle: !!title,
    customDescription: !!description,
  };
}
