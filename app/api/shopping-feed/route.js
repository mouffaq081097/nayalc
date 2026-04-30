import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT
        p.id, p.name, p.slug, p.description, p.price, b.name as "brand", p.stock_quantity,
        c.name as "category", pi.image_url
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, MIN(display_order) as min_order
        FROM product_images
        GROUP BY product_id
      ) min_pi ON p.id = min_pi.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.display_order = min_pi.min_order
      WHERE p.is_active = true AND p.price > 0
    `;

    const { rows } = await db.query(sql);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Naya Lumière Cosmetics Products</title>
    <link>https://nayalc.com</link>
    <description>Luxury beauty and skincare destination in the UAE.</description>
`;

    rows.forEach((product) => {
      const productUrl = `https://nayalc.com/product/${product.slug || product.id}`;
      const imageUrl = product.image_url ? product.image_url.replace(/&/g, '&amp;') : 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png';
      const description = product.description ? product.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : product.name;
      const title = product.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const brand = product.brand ? product.brand.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Naya Lumière Cosmetics';

      xml += `
    <item>
      <g:id>${product.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${product.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${product.price} AED</g:price>
      <g:brand>${brand}</g:brand>
      ${product.category ? `<g:product_type>${product.category.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</g:product_type>` : ''}
    </item>`;
    });

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating shopping feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
