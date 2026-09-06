import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/homepage-images
 * Public. Returns { [slotKey]: { imageUrl, altText } } for every homepage
 * image slot that an admin has overridden. Slots with no row here simply
 * aren't in the response — callers fall back to their own default asset.
 */
export async function GET() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS homepage_images (
        key TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        alt_text TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const { rows } = await db.query('SELECT key, image_url, alt_text FROM homepage_images');
    const map = {};
    for (const row of rows) {
      map[row.key] = { imageUrl: row.image_url, altText: row.alt_text || undefined };
    }
    return NextResponse.json(map, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('Error fetching homepage images:', error);
    return NextResponse.json({}, { status: 200 });
  }
}
