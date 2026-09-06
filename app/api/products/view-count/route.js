import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Real product page views (last 30 days), from the same product_views table
// the storefront's per-product view beacon writes to (see /api/track/product-view).
export async function GET() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_views (
        id BIGSERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        visitor_id TEXT NOT NULL,
        session_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await db.query(`
      SELECT product_id AS "productId", COUNT(*) AS views
      FROM product_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY product_id
    `);

    const views = {};
    for (const r of rows) views[r.productId] = Number(r.views);

    return NextResponse.json({ views });
  } catch (e) {
    console.error('products/view-count error:', e);
    return NextResponse.json({ views: {} }, { status: 200 });
  }
}
