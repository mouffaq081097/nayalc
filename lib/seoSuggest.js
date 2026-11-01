import { generateJson, fetchImageForAi, SchemaType } from './ai/gemini.js';
import { GOOGLE_CATEGORIES, parseGoogleCategoryId } from './googleTaxonomy.js';
import { plainText, SEO_TITLE_LIMIT } from './seo.js';

/**
 * Admin → SEO's AI suggestions (Gemini, lib/ai/gemini.js). Nothing here saves:
 * the admin reads each suggestion and keeps or changes it.
 */

// One line, no wrapping quotes, cut at a word if the model ran long
function clean(value, max) {
  let text = String(value || '').replace(/\s+/g, ' ').replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  if (text.length > max) {
    text = text.slice(0, max);
    const cut = text.lastIndexOf(' ');
    if (cut > max * 0.6) text = text.slice(0, cut);
    text = text.replace(/[\s,;:–-]+$/, '');
  }
  return text;
}

const trimTo = (text, max) => {
  const plain = plainText(text);
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
};

const SHOP = 'nayalc.com, the online shop of Naya Lumière Cosmetics in the United Arab Emirates. It sells authentic GERnétic skincare (made in France), Zorah organic skincare (made in Morocco) and Naya Lumière Perfumes (made in the UAE), delivered across the UAE';

/**
 * A search listing for one product: { seoTitle, seoDescription, googleCategoryId }.
 * `product` carries name, brand, size, form, description, long_description,
 * benefits, ingredients, concerns (names) and collections (names).
 */
export async function suggestProductSeo(product) {
  const facts = {
    name: product.name,
    brand: product.brand || undefined,
    size: product.size || undefined,
    texture: product.form || undefined,
    shortDescription: trimTo(product.description, 600) || undefined,
    fullDescription: trimTo(product.long_description, 1200) || undefined,
    benefits: trimTo(product.benefits, 600) || undefined,
    keyIngredients: trimTo(product.ingredients, 300) || undefined,
    skinConcerns: product.concerns?.length ? product.concerns : undefined,
    collections: product.collections?.length ? product.collections : undefined,
  };
  const prompt = `You write the Google search listing for one product page on ${SHOP}.

Product facts. Use only these; never invent ingredients, results, awards or claims:
${JSON.stringify(facts, null, 2)}

Write:
1. seoTitle: the page title, at most ${SEO_TITLE_LIMIT} characters. Start with the brand and the product name the way shoppers search for it (for example "GERnétic Synchro Night Cream"). Add the size or the product type if it fits, then "UAE" if it still fits. Do not add the shop's name. Title case. No emojis, no quotation marks, no ALL-CAPS words except brand names written that way.
2. seoDescription: the meta description, 140 to 155 characters, in plain English: what the product is, its main benefit taken from the facts, and that it is delivered across the UAE, ending with a short call to action such as "Order online.". No prices, discounts, superlatives ("best", "#1", "luxurious") or medical claims.
3. googleCategoryId: the id of the most specific Google product category below that fits this product.

Google product categories (id: path):
${GOOGLE_CATEGORIES.map((c) => `${c.id}: ${c.path}`).join('\n')}`;

  const out = await generateJson({
    prompt,
    schema: {
      type: SchemaType.OBJECT,
      properties: {
        seoTitle: { type: SchemaType.STRING },
        seoDescription: { type: SchemaType.STRING },
        googleCategoryId: { type: SchemaType.STRING, format: 'enum', enum: GOOGLE_CATEGORIES.map((c) => String(c.id)) },
      },
      required: ['seoTitle', 'seoDescription', 'googleCategoryId'],
    },
  });
  return {
    seoTitle: clean(out.seoTitle, 70),
    seoDescription: clean(out.seoDescription, 170),
    googleCategoryId: parseGoogleCategoryId(out.googleCategoryId),
  };
}

const PLACES = {
  product: 'a product photo on the product page and in product lists',
  collection: 'the photo at the top of a collection page',
  brand: 'the photo for a brand (its page header and the homepage)',
  hero: 'the large banner at the top of the homepage',
  homepage: 'a banner photo on the homepage',
  campaign: 'a campaign banner on the homepage',
  journal: 'the cover photo of a journal (blog) article',
  social: 'a post in the Instagram strip at the bottom of the homepage',
};

/**
 * Alt text for one image: { alt, sawImage }. The model sees the photo when it
 * can be fetched (lib/ai/gemini.js) and otherwise writes from the details.
 * `context` is { kind, label, detail }: label names what it's about
 * ("GERnétic Synchro Night Cream, 50 ml"), detail adds anything useful
 * ("photo 2 of 3", a banner's headline).
 */
export async function suggestAltText({ imageUrl, context = {} }) {
  const image = imageUrl ? await fetchImageForAi(imageUrl) : null;
  const prompt = `Write the alt text for one image on ${SHOP}.

Where it appears: ${PLACES[context.kind] || 'on the website'}.
What it is about: ${context.label || 'unknown'}${context.detail ? `\nMore detail: ${context.detail}` : ''}
${image ? 'Look at the image and describe what it shows.' : 'You cannot see the image. Describe it from the details above, as the photo most likely is.'}

Rules:
- At most 125 characters, as one plain phrase or sentence.
- Say what is visible: for a product, the brand and product name and its packaging (jar, tube, bottle, box) and colours; otherwise the people, products, setting and mood that matter.
- Include words printed on the product when they matter, like its name.
- Do not start with "Image of", "Photo of" or "Picture of". No marketing words ("luxurious", "stunning"), hashtags or emojis. No full stop at the end.`;

  const out = await generateJson({
    prompt,
    image,
    temperature: 0.3,
    schema: { type: SchemaType.OBJECT, properties: { alt: { type: SchemaType.STRING } }, required: ['alt'] },
  });
  return { alt: clean(out.alt, 160).replace(/\.$/, ''), sawImage: !!image };
}
