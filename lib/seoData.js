import { revalidatePath } from 'next/cache';
import db from './db.js';
import { ensureSeoColumns, parseAltText } from './seoColumns.js';
import { HOMEPAGE_IMAGE_SLOTS, getSlot } from './homepageImageSlots.js';
import { refreshProductPages } from './productPages.js';
import { productTitle, plainText } from './seo.js';
import { parseGoogleCategoryId } from './googleTaxonomy.js';

/**
 * Admin → SEO's reads and writes: every image the store shows with its alt
 * text, and each product's search listing and Google category.
 */

// A table that doesn't exist yet (a feature never used) just has no rows
const rowsOf = (promise) => promise.then((r) => r.rows, () => []);

const isVideo = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url || '') || /\/video\/upload\//.test(url || '');

/** Products with their photos, collections and listing, for Admin → SEO → Products. */
export async function loadSeoProducts() {
  await ensureSeoColumns();
  const [products, images, links, concerns] = await Promise.all([
    rowsOf(db.query(`
      SELECT p.id, p.name, p.slug, p.status, p.is_active, p.size, p.form, p.description, p.price,
             p.seo_title, p.seo_description, p.google_category_id, b.name AS brand
        FROM products p LEFT JOIN brands b ON b.id = p.brand_id
       ORDER BY p.name`)),
    rowsOf(db.query(`
      SELECT id, product_id, image_url, alt_text, is_main FROM product_images
       ORDER BY product_id, is_main DESC NULLS LAST, display_order ASC, id ASC`)),
    rowsOf(db.query('SELECT product_id, category_id FROM category_products')),
    rowsOf(db.query('SELECT pc.product_id, c.name FROM product_concerns pc JOIN concerns c ON c.id = pc.concern_id')),
  ]);
  const group = (rows, key, map) => rows.reduce((acc, r) => {
    const k = Number(r[key]);
    if (!acc.has(k)) acc.set(k, []);
    acc.get(k).push(map(r));
    return acc;
  }, new Map());
  const imagesOf = group(images, 'product_id', (r) => ({ id: r.id, url: r.image_url, alt: r.alt_text || '', isMain: !!r.is_main }));
  const collectionsOf = group(links, 'product_id', (r) => Number(r.category_id));
  const concernsOf = group(concerns, 'product_id', (r) => r.name);

  return products.map((p) => ({
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    brand: p.brand || null,
    size: p.size || '',
    form: p.form || '',
    description: plainText(p.description).slice(0, 300),
    visible: !!p.is_active && (!p.status || p.status === 'active'),
    seoTitle: p.seo_title || '',
    seoDescription: p.seo_description || '',
    googleCategoryId: parseGoogleCategoryId(p.google_category_id),
    categoryIds: collectionsOf.get(Number(p.id)) || [],
    concerns: concernsOf.get(Number(p.id)) || [],
    images: imagesOf.get(Number(p.id)) || [],
  }));
}

/** One product with everything the AI may read, or null. */
export async function loadProductFacts(id) {
  await ensureSeoColumns();
  const { rows } = await db.query(`
    SELECT p.id, p.name, p.size, p.form, p.description, p.long_description, p.benefits, p.ingredients, b.name AS brand
      FROM products p LEFT JOIN brands b ON b.id = p.brand_id WHERE p.id = $1`, [id]);
  if (!rows.length) return null;
  const [collections, concerns] = await Promise.all([
    rowsOf(db.query('SELECT c.name FROM category_products cp JOIN categories c ON c.id = cp.category_id WHERE cp.product_id = $1 ORDER BY c.name', [id])),
    rowsOf(db.query('SELECT c.name FROM product_concerns pc JOIN concerns c ON c.id = pc.concern_id WHERE pc.product_id = $1 ORDER BY c.name', [id])),
  ]);
  return { ...rows[0], collections: collections.map((r) => r.name), concerns: concerns.map((r) => r.name) };
}

/**
 * Saves product listings: [{ id, seoTitle?, seoDescription?, googleCategoryId?, imageAlts?: [{ imageId, alt }] }].
 * A field left out stays as it is; an empty one goes back to automatic.
 */
export async function saveProductSeo(items = []) {
  await ensureSeoColumns();
  const clean = (v, max) => {
    const text = String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    return text || null;
  };
  const client = await db.connect();
  let saved = 0;
  try {
    await client.query('BEGIN');
    for (const item of items) {
      const id = Number(item.id);
      if (!Number.isInteger(id)) continue;
      const sets = [];
      const values = [];
      if ('seoTitle' in item) { values.push(clean(item.seoTitle, 120)); sets.push(`seo_title = $${values.length}`); }
      if ('seoDescription' in item) { values.push(clean(item.seoDescription, 320)); sets.push(`seo_description = $${values.length}`); }
      if ('googleCategoryId' in item) { values.push(parseGoogleCategoryId(item.googleCategoryId)); sets.push(`google_category_id = $${values.length}`); }
      if (sets.length) {
        values.push(id);
        const { rowCount } = await client.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
        saved += rowCount;
      }
      for (const { imageId, alt } of item.imageAlts || []) {
        await client.query('UPDATE product_images SET alt_text = $1 WHERE id = $2 AND product_id = $3', [parseAltText(alt), Number(imageId), id]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  refreshProductPages();
  return { saved };
}

/**
 * Every image the store shows, as
 * { key, kind, ref, url, alt, defaultAlt, label, where, editHref, context }.
 * `context` is what "Fill in" writes alt text from (lib/seoWriter.js).
 */
export async function listImages() {
  await ensureSeoColumns();
  const [photos, collections, brands, slides, homepage, campaigns, articles, posts] = await Promise.all([
    rowsOf(db.query(`
      SELECT pi.id, pi.image_url, pi.alt_text, pi.product_id, p.name, p.size, b.name AS brand,
             ROW_NUMBER() OVER (PARTITION BY pi.product_id ORDER BY pi.is_main DESC NULLS LAST, pi.display_order ASC, pi.id ASC) AS n,
             COUNT(*) OVER (PARTITION BY pi.product_id) AS total
        FROM product_images pi
        JOIN products p ON p.id = pi.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
       ORDER BY p.name, n`)),
    rowsOf(db.query('SELECT id, name, image_url, image_alt FROM categories WHERE image_url IS NOT NULL ORDER BY name')),
    rowsOf(db.query('SELECT id, name, imageurl, image_alt FROM brands WHERE imageurl IS NOT NULL ORDER BY name')),
    rowsOf(db.query('SELECT id, headline, eyebrow, image_src_desktop, image_src_mobile, is_video_desktop, is_video_mobile, image_alt FROM hero_slides ORDER BY sort_order, id')),
    rowsOf(db.query('SELECT key, image_url, alt_text FROM homepage_images')),
    rowsOf(db.query('SELECT id, title, subtitle, image_url, image_alt FROM homepage_campaigns WHERE image_url IS NOT NULL ORDER BY starts_at DESC')),
    rowsOf(db.query('SELECT id, title, excerpt, cover_image_url, cover_image_alt FROM journal_articles WHERE cover_image_url IS NOT NULL ORDER BY sort_order, id')),
    rowsOf(db.query('SELECT id, caption, image_url, image_alt FROM social_posts ORDER BY sort_order, id')),
  ]);

  const list = [];
  const add = (item) => list.push({ defaultAlt: '', ...item, key: `${item.kind}:${item.ref}` });

  photos.forEach((r) => {
    const label = `${productTitle(r.name || '', r.brand)}${r.size ? `, ${r.size}` : ''}`;
    add({
      kind: 'product', ref: r.id, url: r.image_url, alt: r.alt_text || '', label,
      where: Number(r.total) > 1 ? `Product photo ${r.n} of ${r.total}` : 'Product photo',
      editHref: `/admin/products/${r.product_id}`,
      context: { kind: 'product', label, detail: `photo ${r.n} of ${r.total}` },
    });
  });
  collections.forEach((r) => add({
    kind: 'collection', ref: r.id, url: r.image_url, alt: r.image_alt || '', label: r.name,
    where: 'Collection page header', editHref: `/admin/categories/${r.id}`,
    context: { kind: 'collection', label: `${r.name} collection` },
  }));
  brands.forEach((r) => add({
    kind: 'brand', ref: r.id, url: r.imageurl, alt: r.image_alt || '', label: r.name,
    where: 'Brand page and homepage', editHref: `/admin/brands/${r.id}`,
    context: { kind: 'brand', label: r.name },
  }));
  slides.forEach((r) => {
    const url = !r.is_video_desktop ? r.image_src_desktop : !r.is_video_mobile ? r.image_src_mobile : null;
    if (!url || isVideo(url)) return;
    // Headlines carry line breaks for the banner's layout
    const headline = String(r.headline || '').replace(/\s+/g, ' ').trim();
    add({
      kind: 'hero', ref: r.id, url, alt: r.image_alt || '', defaultAlt: headline, label: headline || 'Hero slide',
      where: 'Homepage hero banner', editHref: '/admin/hero',
      context: { kind: 'hero', label: headline || 'Homepage banner', detail: r.eyebrow || '' },
    });
  });
  const rowsByKey = new Map(homepage.map((r) => [r.key, r]));
  HOMEPAGE_IMAGE_SLOTS.filter((s) => (s.media || 'image') === 'image').forEach((slot) => {
    const row = rowsByKey.get(slot.key);
    add({
      kind: 'homepage', ref: slot.key, url: row?.image_url || slot.fallbackUrl,
      // The slot's built-in text counts until someone writes their own
      alt: row?.alt_text || '', defaultAlt: slot.alt, label: slot.label,
      where: slot.section, editHref: '/admin/homepage',
      context: { kind: 'homepage', label: slot.label },
    });
  });
  campaigns.forEach((r) => add({
    kind: 'campaign', ref: r.id, url: r.image_url, alt: r.image_alt || '', defaultAlt: r.title || '', label: r.title,
    where: 'Homepage campaign banner', editHref: '/admin/homepage',
    context: { kind: 'campaign', label: r.title, detail: r.subtitle || '' },
  }));
  articles.forEach((r) => add({
    kind: 'journal', ref: r.id, url: r.cover_image_url, alt: r.cover_image_alt || '', label: r.title,
    where: 'Journal article cover', editHref: '/admin/journal',
    context: { kind: 'journal', label: r.title, detail: plainText(r.excerpt).slice(0, 200) },
  }));
  posts.forEach((r) => add({
    kind: 'social', ref: r.id, url: r.image_url, alt: r.image_alt || '', defaultAlt: r.caption || '', label: r.caption || 'Instagram post',
    where: 'Instagram strip', editHref: '/admin/social',
    context: { kind: 'social', label: 'An Instagram post', detail: plainText(r.caption).slice(0, 200) },
  }));
  return list;
}

// kind → how one alt text is stored
const WRITERS = {
  product: (alt, ref) => db.query('UPDATE product_images SET alt_text = $1 WHERE id = $2', [alt, Number(ref)]),
  collection: (alt, ref) => db.query('UPDATE categories SET image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  brand: (alt, ref) => db.query('UPDATE brands SET image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  hero: (alt, ref) => db.query('UPDATE hero_slides SET image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  campaign: (alt, ref) => db.query('UPDATE homepage_campaigns SET image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  journal: (alt, ref) => db.query('UPDATE journal_articles SET cover_image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  social: (alt, ref) => db.query('UPDATE social_posts SET image_alt = $1 WHERE id = $2', [alt, Number(ref)]),
  // A slot still on its built-in photo keeps it: the row's empty image_url means "the default photo"
  homepage: async (alt, ref) => {
    if (!getSlot(ref)) return { rowCount: 0 };
    await db.query(`CREATE TABLE IF NOT EXISTS homepage_images (key TEXT PRIMARY KEY, image_url TEXT NOT NULL, alt_text TEXT, updated_at TIMESTAMP DEFAULT NOW())`);
    return db.query(
      `INSERT INTO homepage_images (key, image_url, alt_text, updated_at) VALUES ($1, '', $2, NOW())
       ON CONFLICT (key) DO UPDATE SET alt_text = EXCLUDED.alt_text, updated_at = NOW()`,
      [ref, alt],
    );
  },
};

export const IMAGE_KINDS = Object.keys(WRITERS);

/** Saves [{ kind, ref, alt }]; an empty alt goes back to the default. Returns { saved }. */
export async function saveAltTexts(items = []) {
  await ensureSeoColumns();
  let saved = 0;
  const kinds = new Set();
  for (const { kind, ref, alt } of items) {
    const write = WRITERS[kind];
    if (!write || ref === undefined || ref === null) continue;
    const { rowCount } = await write(parseAltText(alt), ref);
    if (rowCount) {
      saved += rowCount;
      kinds.add(kind);
    }
  }
  if (kinds.has('product')) refreshProductPages();
  if (['hero', 'homepage', 'campaign', 'social', 'brand'].some((k) => kinds.has(k))) {
    try { revalidatePath('/'); } catch { /* outside a request */ }
  }
  return { saved };
}
