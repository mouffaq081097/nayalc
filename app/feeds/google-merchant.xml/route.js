import db from '@/lib/db';
import { calcShipping, getPreorderInfo } from '@/lib/shipping';
import { ensureBackorderColumns, BACKORDER_SELECT } from '@/lib/backorders';
import { shelfStock, isPreorderOnly, leadDays } from '@/lib/backorderRules';
import { SITE, plainText, productTitle, shortBrand, productUrl } from '@/lib/seo';

// Google Merchant Center product feed (free listings + Shopping), in Google's RSS 2.0 format:
// https://support.google.com/merchants/answer/7052112
// Add it in Merchant Center as a scheduled fetch of https://nayalc.com/feeds/google-merchant.xml.
// Same products the shop shows: active, and with an image (Google rejects items without one).

export const dynamic = 'force-dynamic';

const xml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Characters XML 1.0 can't carry at all
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const aed = (amount) => `${Number(amount).toFixed(2)} AED`;

// in_stock, backorder (with the date it ships — Google requires one) or out_of_stock
function availabilityTags(p) {
  if (shelfStock(p) > 0) return '      <g:availability>in_stock</g:availability>';
  if (isPreorderOnly(p)) {
    return `      <g:availability>backorder</g:availability>
      <g:availability_date>${getPreorderInfo(leadDays(p)).shipByISO}T09:00+0400</g:availability_date>`;
  }
  return '      <g:availability>out_of_stock</g:availability>';
}

// Google's taxonomy, by the shop's own category names
function googleCategory(categoryName) {
  if (/fragr[ae]nce|perfume|parfum/i.test(categoryName || '')) return 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne';
  if (/supplement/i.test(categoryName || '')) return 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements';
  return 'Health & Beauty > Personal Care > Cosmetics > Skin Care';
}

export async function GET() {
  await ensureBackorderColumns();
  const { rows } = await db.query(`
    SELECT p.id, p.slug, p.name, p.description, p.long_description, p.price, p.comparedprice, p.stock_quantity, p.size,
           ${BACKORDER_SELECT},
           b.name AS brand, c.name AS category,
           COALESCE(
             ARRAY_AGG(pi.image_url ORDER BY pi.is_main DESC NULLS LAST, pi.display_order ASC, pi.id ASC)
               FILTER (WHERE pi.image_url IS NOT NULL),
             '{}'
           ) AS images
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.is_active = true AND (p.status = 'active' OR p.status IS NULL)
    GROUP BY p.id, b.name, c.name
    ORDER BY p.id
  `);

  const items = rows
    .filter((p) => p.images.length > 0 && Number(p.price) > 0)
    .map((p) => {
      const price = Number(p.price);
      const compared = Number(p.comparedprice) || 0;
      const onSale = compared > price;
      const description = plainText(p.long_description || p.description) || productTitle(p.name, p.brand);
      const [image, ...more] = p.images;
      return `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${xml(productTitle(p.name, p.brand).slice(0, 150))}</g:title>
      <g:description>${xml(description.slice(0, 5000))}</g:description>
      <g:link>${xml(productUrl(p))}</g:link>
      <g:image_link>${xml(image)}</g:image_link>
${more.slice(0, 10).map((url) => `      <g:additional_image_link>${xml(url)}</g:additional_image_link>`).join('\n')}
${availabilityTags(p)}
      <g:price>${aed(onSale ? compared : price)}</g:price>
${onSale ? `      <g:sale_price>${aed(price)}</g:sale_price>` : ''}
      <g:brand>${xml(shortBrand(p.brand) || 'Naya Lumière Cosmetics')}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${xml(googleCategory(p.category))}</g:google_product_category>
${p.category ? `      <g:product_type>${xml(p.category)}</g:product_type>` : ''}
      <g:shipping>
        <g:country>AE</g:country>
        <g:service>Standard</g:service>
        <g:price>${aed(calcShipping(1))}</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>1</g:max_handling_time>
        <g:min_transit_time>1</g:min_transit_time>
        <g:max_transit_time>3</g:max_transit_time>
      </g:shipping>
    </item>`.replace(/\n\n+/g, '\n');
    });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Naya Lumière Cosmetics</title>
    <link>${SITE}</link>
    <description>Luxury skincare and fragrance in the UAE — GERnétic, Zorah and Naya Lumière Perfumes.</description>
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Fresh prices and stock within the hour, without querying the database on every fetch
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
