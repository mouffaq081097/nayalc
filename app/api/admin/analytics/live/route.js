import { NextResponse } from 'next/server';
import db from '@/lib/db';

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

    // Keep the table small — drop sessions that have been idle for a day.
    await db.query(`DELETE FROM active_sessions WHERE last_seen < NOW() - INTERVAL '1 day'`);

    const { rows } = await db.query(`
      SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) AS live
      FROM active_sessions
      WHERE last_seen > NOW() - INTERVAL '3 minutes'
    `);

    return NextResponse.json({ live: Number(rows[0]?.live || 0) });
  } catch (e) {
    console.error('live analytics error:', e);
    return NextResponse.json({ live: 0 }, { status: 200 });
  }
}
