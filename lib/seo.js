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

// "Synchro Face Care" by GERnétic → "GERnétic Synchro Face Care"; a name that already carries the brand stays as it is
export const productTitle = (name, brand) => {
  const short = shortBrand(brand);
  return short && !name.toLowerCase().includes(short.toLowerCase()) ? `${short} ${name}` : name;
};

export const productUrl = (product) => `${SITE}/product/${product.slug || product.id}`;
