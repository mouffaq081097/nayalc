import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Basic bot/crawler filter so automated traffic doesn't inflate visitor counts.
const BOT_RE = /bot|crawl|spider|slurp|bing|google|baidu|yandex|duckduck|facebookexternalhit|embedly|quora|pinterest|preview|monitor|curl|wget|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i;

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT,
      path TEXT,
      referrer TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits (created_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_site_visits_visitor ON site_visits (visitor_id)`);
}

export async function POST(request) {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

    const body = await request.json().catch(() => ({}));
    const visitorId = String(body.visitorId || '').slice(0, 64);
    if (!visitorId) return NextResponse.json({ ok: false }, { status: 400 });

    const sessionId = String(body.sessionId || '').slice(0, 64);
    const path = String(body.path || '').slice(0, 512);
    const referrer = String(body.referrer || '').slice(0, 512);

    await ensureTable();
    await db.query(
      `INSERT INTO site_visits (visitor_id, session_id, path, referrer, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [visitorId, sessionId, path, referrer, ua.slice(0, 512)]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('track/visit error:', e);
    // Never let tracking break the storefront.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
