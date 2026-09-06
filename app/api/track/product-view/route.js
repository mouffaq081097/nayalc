import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Basic bot/crawler filter so automated traffic doesn't inflate view counts.
const BOT_RE = /bot|crawl|spider|slurp|bing|google|baidu|yandex|duckduck|facebookexternalhit|embedly|quora|pinterest|preview|monitor|curl|wget|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i;

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_views (
      id BIGSERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views (product_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON product_views (created_at)`);
}

export async function POST(request) {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

    const body = await request.json().catch(() => ({}));
    const productId = Number(body.productId);
    const visitorId = String(body.visitorId || '').slice(0, 64);
    if (!productId || !visitorId) return NextResponse.json({ ok: false }, { status: 400 });

    const sessionId = String(body.sessionId || '').slice(0, 64);

    await ensureTable();
    await db.query(
      `INSERT INTO product_views (product_id, visitor_id, session_id) VALUES ($1, $2, $3)`,
      [productId, visitorId, sessionId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('track/product-view error:', e);
    // Never let tracking break the storefront.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
