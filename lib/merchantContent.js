import { plainText, productTitle, shortBrand } from './seo.js';

/**
 * What the Google Merchant Center feed writes for each product: its title,
 * a full description, product highlights and product details. Built only from
 * what the product already says in Admin → Products (name, brand, size,
 * texture, description, long description, benefits, how to use, skin
 * concerns) — nothing invented, no AI. Isomorphic, so Admin → SEO → Google
 * Merchant can show exactly what Google gets.
 *
 * Google's guidance this follows (support.google.com/merchants/answer/6324436, 6324468):
 *   title: brand + product + product type + size, up to 150 characters, no promo text;
 *   description: up to 5000 characters, the product itself (no shipping or shop info);
 *   product_highlight: 2–10 short bullets, up to 150 characters each;
 *   product_detail: section / attribute / value facts.
 */

export const FEED_TITLE_LIMIT = 150;
export const FEED_DESCRIPTION_LIMIT = 5000;
const HIGHLIGHT_LIMIT = 150;
const MAX_HIGHLIGHTS = 10;

const fold = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const squash = (text) => fold(text).replace(/[^a-z0-9]/g, '');
const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const SMALL_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'of', 'and', 'for', 'with', 'à', 'a']);
const titleCase = (text) => clean(text).split(' ')
  .map((word, i) => (i && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
  .join(' ');

// Text kept with line breaks and list items as separate lines ("Benefits", "How to use")
const textLines = (value) => String(value || '')
  .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, '\n')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .split('\n')
  .map((line) => clean(line).replace(/^[-•*·–✓✔]+\s*/, '').replace(/^\d+[.)]\s+/, ''))
  .filter(Boolean);

const sentence = (text) => (/[.!?…]$/.test(text) ? text : `${text}.`);

function cutAtWord(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.5 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,;:–-]+$/, '');
}

/** Where the store says a brand is made (the flags on its cards), or ''. */
export function madeInCountry(brand) {
  if (/gern[eé]t/i.test(brand || '')) return 'France';
  if (/naya\s*lumi[eè]re?\s*perfumes?/i.test(brand || '')) return 'United Arab Emirates';
  return '';
}

const madeIn = (country) => `Made in ${country === 'United Arab Emirates' ? 'the ' : ''}${country}`;

/**
 * "GERnétic SYNCHROS Night Cream 50 ml", "Naya Lumière Oud Royal Eau de Parfum 100 ml":
 * brand, product, its texture when the name doesn't say it, then the size.
 */
export function feedTitle(p) {
  const base = productTitle(p.name || '', p.brand);
  const form = clean(p.form);
  const size = clean(p.size);
  let title = base;
  if (form && form.length <= 40 && !squash(title).includes(squash(form))) title += ` ${titleCase(form)}`;
  if (size && !squash(title).includes(squash(size))) title += ` ${size}`;
  return title.length <= FEED_TITLE_LIMIT ? title : cutAtWord(base.length <= FEED_TITLE_LIMIT ? title : base, FEED_TITLE_LIMIT);
}

/** The short and long descriptions as one text, without saying the same thing twice. */
function ownWords(p) {
  const short = plainText(p.description);
  const long = plainText(p.long_description ?? p.longDescription);
  if (!short) return long;
  if (!long) return short;
  if (squash(long).includes(squash(short))) return long;
  if (squash(short).includes(squash(long))) return short;
  return `${sentence(short)} ${long}`;
}

const concernList = (p) => (p.concerns || []).map((c) => clean(typeof c === 'string' ? c : c?.name)).filter(Boolean);

const joinList = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] || '');

/**
 * Up to 5000 characters about the product: its own description, then its
 * benefits, skin concerns, how to use it, size, texture and where it's made.
 */
export function feedDescription(p) {
  const parts = [];
  const own = ownWords(p);
  if (own) parts.push(sentence(own));

  const benefits = textLines(p.benefits);
  if (benefits.length) parts.push(`Benefits: ${benefits.map((b) => b.replace(/[.;]+$/, '')).join('; ')}.`);

  const concerns = concernList(p);
  if (concerns.length) parts.push(`Suited to ${joinList(concerns.map((c) => c.toLowerCase()))}.`);

  const howTo = textLines(p.how_to_use ?? p.howToUse);
  if (howTo.length) parts.push(`How to use: ${howTo.map((s) => s.replace(/[.;]+$/, '')).join('. ')}.`);

  const facts = [];
  const size = clean(p.size);
  const form = clean(p.form);
  if (size) facts.push(`Size: ${size}`);
  if (form) facts.push(`Texture: ${form.toLowerCase()}`);
  const country = madeInCountry(p.brand);
  if (country && !fold(parts.join(' ')).includes('made in')) facts.push(madeIn(country));
  if (facts.length) parts.push(`${facts.join('. ')}.`);

  // Nothing written at all: name the product properly rather than send an empty description
  if (!own && !benefits.length) {
    const title = feedTitle(p);
    const brand = shortBrand(p.brand);
    parts.unshift(sentence(brand && fold(title).includes(fold(brand)) ? title : `${title} by ${brand || 'Naya Lumière Cosmetics'}`));
  }

  const text = parts.join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
  return text.length <= FEED_DESCRIPTION_LIMIT ? text : `${cutAtWord(text, FEED_DESCRIPTION_LIMIT - 1)}…`;
}

/**
 * 2–10 short bullets for Google's product_highlight: the product's benefits
 * (one per line in Admin → Products), its skin concerns, then its size and origin.
 * Fewer than two facts → [] (Google wants at least two).
 */
export function feedHighlights(p) {
  const out = [];
  const add = (text) => {
    const line = cutAtWord(clean(text).replace(/[.;]+$/, ''), HIGHLIGHT_LIMIT);
    if (line.length >= 3 && !out.some((o) => squash(o) === squash(line))) out.push(line);
  };
  // A benefits field written as one paragraph is split into its sentences
  const benefits = textLines(p.benefits);
  const bullets = benefits.length === 1 ? (benefits[0].match(/[^.!?]+[.!?]*/g) || []).map(clean) : benefits;
  bullets.forEach(add);
  const concerns = concernList(p);
  if (concerns.length) add(`Suited to ${joinList(concerns.map((c) => c.toLowerCase()))}`);
  const form = clean(p.form);
  const size = clean(p.size);
  if (size || form) add([form && titleCase(form), size].filter(Boolean).join(', '));
  const country = madeInCountry(p.brand);
  if (country) add(madeIn(country));
  const list = out.slice(0, MAX_HIGHLIGHTS);
  return list.length >= 2 ? list : [];
}

/** Google's product_detail: [{ section, name, value }] for the facts the product states. */
export function feedDetails(p) {
  const details = [];
  const add = (section, name, value) => {
    const v = clean(value);
    if (v) details.push({ section, name, value: cutAtWord(v, 1000) });
  };
  add('General', 'Brand', shortBrand(p.brand));
  add('General', 'Size', p.size);
  add('General', 'Texture', p.form && titleCase(p.form));
  add('General', 'Country of origin', madeInCountry(p.brand));
  const concerns = concernList(p);
  if (concerns.length) add('Skin', 'Skin concerns', concerns.join(', '));
  const ingredients = plainText(p.ingredients);
  if (ingredients) add('Composition', 'Ingredients', ingredients);
  return details;
}
