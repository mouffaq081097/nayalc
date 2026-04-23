import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    await db.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_video TEXT');
    return NextResponse.json({ message: 'Column how_to_use_video added successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ message: 'Error adding column', error: error.message }, { status: 500 });
  }
}
