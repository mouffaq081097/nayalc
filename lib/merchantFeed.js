import db from './db.js';
import { ensureBackorderColumns, BACKORDER_SELECT } from './backorders.js';
import { ensureSizeGroupColumn } from './sizeGroups.js';
import { ensureSeoColumns } from './seoColumns.js';
import { shelfStock, isPreorderOnly, leadDays } from './backorderRules.js';
import { getPreorderInfo } from './shipping.js';
import { plainText, productTitle, shortBrand, productUrl, STORE_NAME } from './seo.js';
import { googleCategory, resolveGoogleCategory, productTypePath } from './googleTaxonomy.js';

/**
 * What the Google Merchant Center feed sends for each product
 * (/feeds/google-merchant.xml), and what Admin → SEO → Google Merchant checks.
 * One function for both, so the check shows exactly what Google receives.
 */

const MIN_DESCRIPTION = 50;

// "GERnétic Synchro Night Cream 50 ml": Google asks for brand, product and size in the title
export function feedTitle(p) {
  const base = productTitle(p.name || '', p.brand);
  const size = String(p.size || '').trim();
  const squash = (s) => s.toLowerCase().replace(/\s+/g, '');
  return (size && !squash(base).includes(squash(size)) ? `${base} ${size}` : base).slice(0, 150);
}

function availability(p) {
  if (shelfStock(p) > 0) return { availability: 'in_stock' };
  if (isPreorderOnly(p)) return { availability: 'backorder', availabilityDate: `${getPreorderInfo(leadDays(p)).shipByISO}T09:00+0400` };
  return { availability: 'out_of_stock' };
}

/**
 * Every product with what Google gets for it:
 * { id, name, brand, image, included, reasons (why it's left out), issues (what Google may flag),
 *   category: { id, path, label, source, collection }, productType, title, description, … }.
 * `onlyIncluded` keeps just the products the feed sends.
 */
export async function loadMerchantItems({ onlyIncluded = false } = {}) {
  await Promise.all([ensureBackorderColumns(), ensureSeoColumns(), ensureSizeGroupColumn().catch(() => {})]);
  const hasSizeGroup = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'products' AND column_name = 'size_group'",
  ).then((r) => r.rows.length > 0, () => false);

  const [{ rows: products }, { rows: categories }, { rows: links }] = await Promise.all([
    db.query(`
      SELECT p.id, p.slug, p.name, p.description, p.long_description, p.price, p.comparedprice, p.stock_quantity, p.size, p.form,
             p.is_active, p.status, p.google_category_id, ${hasSizeGroup ? 'p.size_group' : 'NULL AS size_group'},
             ${BACKORDER_SELECT},
             b.name AS brand,
             COALESCE(
               ARRAY_AGG(pi.image_url ORDER BY pi.is_main DESC NULLS LAST, pi.display_order ASC, pi.id ASC)
                 FILTER (WHERE pi.image_url IS NOT NULL),
               '{}'
             ) AS images
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON pi.product_id = p.id
       GROUP BY p.id, b.name
       ORDER BY p.id`),
    db.query('SELECT id, name, parent_id AS "parentId", google_category_id AS "googleCategoryId" FROM categories'),
    db.query('SELECT product_id, category_id FROM category_products'),
  ]);

  const byId = new Map(categories.map((c) => [Number(c.id), c]));
  const collectionsOf = new Map();
  for (const { product_id: pid, category_id: cid } of links) {
    const c = byId.get(Number(cid));
    if (!c) continue;
    if (!collectionsOf.has(Number(pid))) collectionsOf.set(Number(pid), []);
    collectionsOf.get(Number(pid)).push(c);
  }

  const items = products.map((p) => {
    const collections = collectionsOf.get(Number(p.id)) || [];
    const price = Number(p.price) || 0;
    const compared = Number(p.comparedprice) || 0;
    const onSale = compared > price;
    const resolved = resolveGoogleCategory(p, collections, byId);
    const category = { ...googleCategory(resolved.id), source: resolved.source, collection: resolved.collection || null };
    const ownDescription = plainText(p.long_description || p.description);
    const title = feedTitle(p);

    const reasons = [];
    if (!p.is_active || (p.status && p.status !== 'active')) reasons.push('Hidden or draft');
    if (!p.images.length) reasons.push('No photo');
    if (!(price > 0)) reasons.push('No price');

    const issues = [];
    if (ownDescription.length < MIN_DESCRIPTION) issues.push('Description under 50 characters');
    if (!p.brand) issues.push(`No brand, sent as ${STORE_NAME}`);
    if (productTitle(p.name || '', p.brand).length + (p.size ? p.size.length + 1 : 0) > 150) issues.push('Title over 150 characters, cut');
    if (!collections.length) issues.push('In no collection');

    return {
      id: Number(p.id),
      name: p.name,
      slug: p.slug,
      brand: p.brand || null,
      image: p.images[0] || null,
      images: p.images,
      included: reasons.length === 0,
      reasons,
      issues,
      category,
      productType: productTypePath(collections, byId),
      title,
      description: (ownDescription || title).slice(0, 5000),
      link: productUrl(p),
      price,
      compared: onSale ? compared : null,
      ...availability(p),
      brandName: shortBrand(p.brand) || STORE_NAME,
      itemGroupId: p.size_group ? `size-${p.size_group}` : null,
      size: p.size_group && p.size ? String(p.size).trim() : null,
      collections: collections.map((c) => c.name),
    };
  });

  return onlyIncluded ? items.filter((i) => i.included) : items;
}
