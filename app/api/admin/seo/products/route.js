import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { loadSeoProducts, saveProductSeo } from '@/lib/seoData';

/**
 * GET /api/admin/seo/products — every product's search listing, photos and collections,
 * plus the collections (for the Google category each product inherits).
 */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const [products, { rows: categories }] = await Promise.all([
      loadSeoProducts(),
      db.query('SELECT id, name, parent_id AS "parentId", google_category_id AS "googleCategoryId" FROM categories ORDER BY name'),
    ]);
    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error('SEO products load failed:', error);
    return NextResponse.json({ message: 'Could not load the products.' }, { status: 500 });
  }
}

/** PUT /api/admin/seo/products — { items: [{ id, seoTitle?, seoDescription?, googleCategoryId?, imageAlts? }] } */
export async function PUT(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ message: 'Nothing to save.' }, { status: 400 });
    return NextResponse.json(await saveProductSeo(items.slice(0, 500)));
  } catch (error) {
    console.error('SEO products save failed:', error);
    return NextResponse.json({ message: 'The changes could not be saved. Please try again.' }, { status: 500 });
  }
}
