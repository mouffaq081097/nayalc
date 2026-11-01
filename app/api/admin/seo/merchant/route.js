import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { loadMerchantItems } from '@/lib/merchantFeed';
import { ensureSeoColumns } from '@/lib/seoColumns';
import { parseGoogleCategoryId } from '@/lib/googleTaxonomy';
import { SITE } from '@/lib/seo';

/** GET /api/admin/seo/merchant — what the feed sends for each product, and each collection's Google category. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const items = await loadMerchantItems();
    const { rows: categories } = await db.query(`
      SELECT c.id, c.name, c.parent_id AS "parentId", c.is_active AS "isActive", c.google_category_id AS "googleCategoryId",
             (SELECT COUNT(*)::int FROM category_products cp WHERE cp.category_id = c.id) AS "productCount"
        FROM categories c ORDER BY c.name`);
    return NextResponse.json({ feedUrl: `${SITE}/feeds/google-merchant.xml`, items, categories });
  } catch (error) {
    console.error('Merchant check failed:', error);
    return NextResponse.json({ message: 'Could not check the feed.' }, { status: 500 });
  }
}

/** PUT /api/admin/seo/merchant — { collections: [{ id, googleCategoryId }] }; null = worked out from the names. */
export async function PUT(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { collections } = await request.json();
    if (!Array.isArray(collections) || !collections.length) return NextResponse.json({ message: 'Nothing to save.' }, { status: 400 });
    await ensureSeoColumns();
    let saved = 0;
    for (const { id, googleCategoryId } of collections.slice(0, 500)) {
      const { rowCount } = await db.query('UPDATE categories SET google_category_id = $1 WHERE id = $2', [parseGoogleCategoryId(googleCategoryId), Number(id)]);
      saved += rowCount;
    }
    return NextResponse.json({ saved });
  } catch (error) {
    console.error('Merchant categories save failed:', error);
    return NextResponse.json({ message: 'The categories could not be saved. Please try again.' }, { status: 500 });
  }
}
