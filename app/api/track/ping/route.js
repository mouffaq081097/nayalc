import { NextResponse } from 'next/server';
import db from '@/lib/db';

const BOT_RE = /bot|crawl|spider|slurp|bing|google|baidu|yandex|duckduck|facebookexternalhit|embedly|quora|pinterest|preview|monitor|curl|wget|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i;

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT,
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS path TEXT`);
}

export async function POST(request) {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.sessionId || '').slice(0, 64);
    const visitorId = String(body.visitorId || '').slice(0, 64);
    const path = String(body.path || '').slice(0, 512);
    if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

    await ensureTable();
    await db.query(
      `INSERT INTO active_sessions (session_id, visitor_id, path, last_seen)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (session_id) DO UPDATE SET last_seen = NOW(), visitor_id = EXCLUDED.visitor_id, path = EXCLUDED.path`,
      [sessionId, visitorId, path]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('track/ping error:', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
