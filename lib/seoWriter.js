import { productTitle, plainText, shortBrand, SEO_TITLE_LIMIT } from './seo.js';

/**
 * Admin → SEO's "Fill in": page titles, meta descriptions and alt text written
 * from what the product already says (name, brand, size, texture, short
 * description, skin concerns). No AI and no outside service: it runs in the
 * browser, costs nothing and never invents a claim. Isomorphic.
 */

// A little under Google's ~160, so the whole description shows
export const DESCRIPTION_TARGET = 155;
// Screen readers handle about this much alt text comfortably
export const ALT_TARGET = 125;

const fold = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const squash = (text) => fold(text).replace(/\s+/g, '');
const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

// Cut at the last whole word that fits
function cutAtWord(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.5 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,;:–-]+$/, '');
}

// As many whole sentences as fit; else whole words and "…"
function fitSentences(text, max) {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  return out.trim() || `${cutAtWord(text, max - 1)}…`;
}

const SMALL_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'of', 'and', 'for', 'with', 'à', 'a']);
// "eau de parfum" → "Eau de Parfum"
const titleCase = (text) => clean(text).split(' ')
  .map((word, i) => (i && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
  .join(' ');

// Where the store says a brand is made, as the flags on its cards do
function madeIn(brand) {
  if (/gern[eé]t/i.test(brand || '')) return 'Made in France.';
  if (/naya\s*lumi[eè]re?\s*perfumes?/i.test(brand || '')) return 'Made in the UAE.';
  return '';
}

// "GERnétic SYNCHROS Night Cream" plus its size, unless the name already says it
function nameWithSize({ name, brand, size }) {
  const base = productTitle(name || '', brand);
  const sizeText = clean(size);
  return sizeText && !squash(base).includes(squash(sizeText)) ? { base, sized: `${base} ${sizeText}` } : { base, sized: base };
}

/**
 * A page title of at most 60 characters: brand and product first, then the
 * size and texture when they add something, then "Buy in UAE" when it fits.
 */
export function writeSeoTitle(product) {
  const { base, sized } = nameWithSize(product);
  const sizeText = sized === base ? '' : sized.slice(base.length).trim();
  const form = clean(product.form);
  // The texture only when the name doesn't already say it ("Oud Lumière" + "Eau de parfum")
  const named = form && !fold(base).includes(fold(form)) ? `${base} ${titleCase(form)}` : base;
  const full = sizeText ? `${named} ${sizeText}` : named;
  const candidates = [`${full} | Buy in UAE`, `${full} | UAE`, `${named} | Buy in UAE`, full, `${sized} | UAE`, sized, named, base];
  return candidates.find((c) => c.length <= SEO_TITLE_LIMIT) || cutAtWord(base, SEO_TITLE_LIMIT);
}

/**
 * A meta description of about 150 characters: the product's name and size, its
 * own short description (whole sentences), then delivery, its skin concerns and
 * where it's made, as far as they fit. Only facts the product already states.
 */
export function writeSeoDescription(product) {
  const { sized } = nameWithSize(product);
  const lead = `${sized}.`;
  const own = plainText(product.description);
  const delivery = 'Delivered across the UAE.';
  const concerns = (product.concerns || []).map((c) => clean(c).toLowerCase()).filter(Boolean);
  const goodFor = concerns.length
    ? `Good for ${concerns.length > 1 ? `${concerns.slice(0, -1).join(', ')} and ${concerns[concerns.length - 1]}` : concerns[0]}.`
    : '';
  const origin = madeIn(product.brand);

  // Room for the product's own words after its name and the delivery line
  const room = DESCRIPTION_TARGET - lead.length - delivery.length - 2;
  let text = lead;
  if (own && room > 30) text += ` ${fitSentences(own.endsWith('.') || own.endsWith('!') ? own : `${own}.`, room)}`;
  // Where it's made only when its own words don't say so already; the shop line when there's room
  const shopLine = product.brand ? `Shop authentic ${shortBrand(product.brand)} at Naya Lumière Cosmetics.` : '';
  for (const extra of [delivery, goodFor, fold(text).includes('made in') ? '' : origin, shopLine]) {
    if (extra && text.length + 1 + extra.length <= DESCRIPTION_TARGET) text += ` ${extra}`;
  }
  return text.length > 160 ? `${cutAtWord(text, 159)}…` : text;
}

/**
 * Alt text for an image from what it's about. `image` is an entry of Admin →
 * SEO's image list ({ kind, label, defaultAlt, context }) or an editor's
 * context ({ kind, label, detail }).
 */
export function writeAltText(image) {
  const kind = image.kind || image.context?.kind;
  const label = clean(image.context?.label || image.label);
  const detail = clean(image.context?.detail || image.detail);
  let text;
  switch (kind) {
    case 'product': {
      // "photo 2 of 3": the first photo is the product; the others say which one they are
      const [, n, total] = detail.match(/(\d+)\s+of\s+(\d+)/) || [];
      text = n && Number(n) > 1 ? `${label} (${n} of ${total})` : label;
      break;
    }
    case 'collection':
      text = /collection$/i.test(label) ? label : `${label} collection`;
      break;
    case 'brand':
      text = `${label} products`;
      break;
    case 'hero':
      text = detail ? `${detail}: ${label}` : label;
      break;
    case 'campaign':
      text = detail ? `${label}: ${detail}` : label;
      break;
    case 'homepage':
      // The slot's own description of its built-in photo
      text = clean(image.defaultAlt) || label;
      break;
    case 'social':
      text = detail ? fitSentences(detail, ALT_TARGET) : 'Naya Lumière Cosmetics on Instagram';
      break;
    default:
      text = label;
  }
  return cutAtWord(clean(text), ALT_TARGET);
}
