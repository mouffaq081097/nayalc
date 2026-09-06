import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Safe no-op if the storefront tracker has already created it.
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

    const { rows: totalRows } = await db.query(`
      SELECT
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS cur,
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS prev,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS views
      FROM site_visits
    `);

    const { rows: dailyRows } = await db.query(`
      SELECT created_at::date AS day, COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
    `);

    // Build a 30-length series aligned to today (index 29 = today).
    const series = new Array(30).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const r of dailyRows) {
      const d = new Date(r.day); d.setHours(0, 0, 0, 0);
      const idx = 29 - Math.round((today.getTime() - d.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 30) series[idx] = Number(r.visitors);
    }

    const cur = Number(totalRows[0]?.cur || 0);
    const prev = Number(totalRows[0]?.prev || 0);
    const views = Number(totalRows[0]?.views || 0);

    return NextResponse.json({
      visitors: cur,
      visitorsDelta: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null,
      views,
      series,
    });
  } catch (e) {
    console.error('admin visits analytics error:', e);
    return NextResponse.json({ visitors: 0, visitorsDelta: null, views: 0, series: new Array(30).fill(0) }, { status: 200 });
  }
}
