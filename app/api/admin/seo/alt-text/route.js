import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { suggestAltText } from '@/lib/seoSuggest';

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

/**
 * POST /api/admin/seo/alt-text — { imageUrl?, context: { kind, label, detail } } → { alt, sawImage }.
 * The AI looks at the image when it's on the store's Cloudinary account or the site itself
 * (lib/ai/gemini.js); a new photo that isn't uploaded yet is described from the details.
 */
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const context = { kind: text(body.context?.kind, 20), label: text(body.context?.label, 200), detail: text(body.context?.detail, 300) };
    if (!context.label && !body.imageUrl) return NextResponse.json({ message: 'Nothing to describe.' }, { status: 400 });
    return NextResponse.json(await suggestAltText({ imageUrl: text(body.imageUrl, 1000), context }));
  } catch (error) {
    if (error.status) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('Alt text suggestion failed:', error);
    return NextResponse.json({ message: 'The suggestion could not be made. Please try again.' }, { status: 500 });
  }
}
