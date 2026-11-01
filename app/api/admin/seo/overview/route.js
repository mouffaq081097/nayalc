import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listImages, loadSeoProducts } from '@/lib/seoData';
import { loadMerchantItems } from '@/lib/merchantFeed';

/** GET /api/admin/seo/overview — the numbers on Admin → SEO. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const [products, images, items] = await Promise.all([loadSeoProducts(), listImages(), loadMerchantItems()]);
    const live = products.filter((p) => p.visible);
    const inFeed = items.filter((i) => i.included);
    return NextResponse.json({
      products: {
        live: live.length,
        customTitle: live.filter((p) => p.seoTitle).length,
        customDescription: live.filter((p) => p.seoDescription).length,
        automatic: live.filter((p) => !p.seoTitle || !p.seoDescription).length,
      },
      images: {
        total: images.length,
        missing: images.filter((i) => !i.alt && !i.defaultAlt).length,
      },
      merchant: {
        inFeed: inFeed.length,
        leftOut: items.filter((i) => !i.included && !i.reasons.includes('Hidden or draft')).length,
        withIssues: inFeed.filter((i) => i.issues.length).length,
        brandDefault: inFeed.filter((i) => i.category.source === 'brand').length,
      },
    });
  } catch (error) {
    console.error('SEO overview failed:', error);
    return NextResponse.json({ message: 'Could not load the SEO overview.' }, { status: 500 });
  }
}
