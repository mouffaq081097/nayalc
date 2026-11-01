import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { loadProductFacts } from '@/lib/seoData';
import { suggestProductSeo } from '@/lib/seoSuggest';

// The editor's unsaved text goes over what's stored, so a suggestion matches what the admin sees
const DRAFT_FIELDS = ['name', 'brand', 'size', 'form', 'description', 'long_description', 'benefits', 'ingredients'];

/**
 * POST /api/admin/seo/products/suggest — { productId?, draft? } → { seoTitle, seoDescription, googleCategoryId }.
 * Nothing is saved.
 */
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { productId, draft } = await request.json();
    const stored = productId ? await loadProductFacts(Number(productId)) : null;
    if (productId && !stored) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    const facts = { ...(stored || {}) };
    if (draft && typeof draft === 'object') {
      for (const key of DRAFT_FIELDS) if (typeof draft[key] === 'string') facts[key] = draft[key].slice(0, 5000);
      for (const key of ['concerns', 'collections']) {
        if (Array.isArray(draft[key])) facts[key] = draft[key].filter((v) => typeof v === 'string').slice(0, 20);
      }
    }
    if (!String(facts.name || '').trim()) return NextResponse.json({ message: 'Add a product title first.' }, { status: 400 });
    return NextResponse.json(await suggestProductSeo(facts));
  } catch (error) {
    if (error.status) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('SEO suggestion failed:', error);
    return NextResponse.json({ message: 'The suggestion could not be made. Please try again.' }, { status: 500 });
  }
}
