import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { fillAllProductSeo } from '@/lib/seoData';

export const maxDuration = 60;

/**
 * POST /api/admin/seo/products/fill-all — { overwrite?: boolean }
 * Writes and saves every product's page title, meta description and photo alt text
 * from its own details (no AI, nothing sent anywhere). Without `overwrite`, text
 * someone already wrote is kept.
 */
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { overwrite = false } = await request.json().catch(() => ({}));
    return NextResponse.json(await fillAllProductSeo({ overwrite: overwrite === true }));
  } catch (error) {
    console.error('SEO fill-all failed:', error);
    return NextResponse.json({ message: 'The products could not be updated. Please try again.' }, { status: 500 });
  }
}
