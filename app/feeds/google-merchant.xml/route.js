import { calcShipping } from '@/lib/shipping';
import { SITE } from '@/lib/seo';
import { loadMerchantItems } from '@/lib/merchantFeed';

// Google Merchant Center product feed (free listings + Shopping), in Google's RSS 2.0 format:
// https://support.google.com/merchants/answer/7052112
// Add it in Merchant Center as a scheduled fetch of https://nayalc.com/feeds/google-merchant.xml.
// Same products the shop shows: active, and with an image (Google rejects items without one).
// What goes in each item is worked out in lib/merchantFeed.js, which Admin → SEO → Google Merchant also reads.

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

// Only the tags that have a value, one per line
const tags = (pairs) => pairs
  .filter(([, value]) => value !== null && value !== undefined && value !== '')
  .map(([name, value]) => `      <g:${name}>${xml(value)}</g:${name}>`)
  .join('\n');

export async function GET() {
  const items = (await loadMerchantItems({ onlyIncluded: true })).map((p) => {
    const [image, ...more] = p.images;
    return `    <item>
${tags([
  ['id', p.id],
  ['title', p.title],
  ['description', p.description],
  ['link', p.link],
  ['image_link', image],
  ...more.slice(0, 10).map((url) => ['additional_image_link', url]),
  ['availability', p.availability],
  ['availability_date', p.availabilityDate],
  // The full price, with the reduced one as sale_price, so Google shows the saving
  ['price', aed(p.compared ?? p.price)],
  ['sale_price', p.compared ? aed(p.price) : null],
  ['brand', p.brandName],
  ['condition', 'new'],
  ['identifier_exists', 'no'],
  // Google's own id for the category (lib/googleTaxonomy.js), and the shop's collection path
  ['google_product_category', p.category.id],
  ['product_type', p.productType],
  // Sizes of one product (Admin → Products → Sizes) are one product in several sizes to Google
  ['item_group_id', p.itemGroupId],
  ['size', p.size],
])}
      <g:shipping>
        <g:country>AE</g:country>
        <g:service>Standard</g:service>
        <g:price>${aed(calcShipping(1))}</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>1</g:max_handling_time>
        <g:min_transit_time>1</g:min_transit_time>
        <g:max_transit_time>3</g:max_transit_time>
      </g:shipping>
    </item>`;
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
