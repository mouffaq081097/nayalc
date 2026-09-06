import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Real concurrent "viewing now" counts per product, derived from the same
// heartbeat pings that back the sitewide live-visitor count (see /api/track/ping),
// matched to a product by its page path (/product/<slug>).
export async function GET() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        session_id TEXT PRIMARY KEY,
        visitor_id TEXT,
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS path TEXT`);

    const { rows } = await db.query(`
      SELECT p.id AS "productId", COUNT(DISTINCT COALESCE(a.visitor_id, a.session_id)) AS live
      FROM active_sessions a
      JOIN products p ON a.path = '/product/' || p.slug
      WHERE a.last_seen > NOW() - INTERVAL '3 minutes'
      GROUP BY p.id
    `);

    const live = {};
    for (const r of rows) live[r.productId] = Number(r.live);

    return NextResponse.json({ live });
  } catch (e) {
    console.error('products/live-viewers error:', e);
    return NextResponse.json({ live: {} }, { status: 200 });
  }
}
