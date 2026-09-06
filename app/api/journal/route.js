import { NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_articles (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tag TEXT,
      read_time TEXT,
      excerpt TEXT,
      body TEXT,
      cover_image_url TEXT,
      cta_label TEXT,
      cta_href TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * GET /api/journal — public. Active articles only, ordered for display.
 */
export async function GET() {
  try {
    await ensureTable();
    const { rows } = await db.query(
      `SELECT id, slug, title, tag, read_time as "readTime", excerpt, body, cover_image_url as "coverImageUrl",
              cta_label as "ctaLabel", cta_href as "ctaHref", sort_order as "sortOrder"
       FROM journal_articles
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`
    );
    rows.forEach((r) => {
      r.body = r.body ? r.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
    });
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('Error fetching journal articles:', error);
    return NextResponse.json({ message: 'Error fetching journal articles', error: error.message }, { status: 500 });
  }
}
