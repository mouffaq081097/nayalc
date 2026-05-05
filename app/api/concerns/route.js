import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const sql = 'SELECT id, name, slug, description, image_url FROM concerns ORDER BY name ASC';
    let rows;
    try {
        const result = await db.query(sql);
        rows = result.rows;
    } catch (dbError) {
        // If table doesn't exist yet, return empty list instead of crashing
        console.warn('Concerns table not found, please run SQL migration.');
        return NextResponse.json([]);
    }
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('Error fetching concerns:', error);
    return NextResponse.json({ message: 'Error fetching concerns from database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description, image_url } = await request.json();
    if (!name) return NextResponse.json({ message: 'Name is required' }, { status: 400 });

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const sql = 'INSERT INTO concerns (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING id';
    const { rows } = await db.query(sql, [name, slug, description, image_url]);
    
    return NextResponse.json({ message: 'Concern created', id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error creating concern:', error);
    return NextResponse.json({ message: 'Error creating concern', error: error.message }, { status: 500 });
  }
}
