import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listImages, saveAltTexts } from '@/lib/seoData';

/** GET /api/admin/seo/images — every image the store shows, with its alt text. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ images: await listImages() });
  } catch (error) {
    console.error('Image list failed:', error);
    return NextResponse.json({ message: 'Could not load the images.' }, { status: 500 });
  }
}

/** PUT /api/admin/seo/images — { items: [{ kind, ref, alt }] } */
export async function PUT(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ message: 'Nothing to save.' }, { status: 400 });
    return NextResponse.json(await saveAltTexts(items.slice(0, 1000)));
  } catch (error) {
    console.error('Alt text save failed:', error);
    return NextResponse.json({ message: 'The alt text could not be saved. Please try again.' }, { status: 500 });
  }
}
