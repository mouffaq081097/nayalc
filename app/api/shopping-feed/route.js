import { NextResponse } from 'next/server';
import { SITE } from '@/lib/seo';

// The old product feed. There is one feed now, /feeds/google-merchant.xml (lib/merchantFeed.js),
// so a Merchant Center account still pointed here gets the same, complete data.
export function GET() {
  return NextResponse.redirect(`${SITE}/feeds/google-merchant.xml`, 308);
}
