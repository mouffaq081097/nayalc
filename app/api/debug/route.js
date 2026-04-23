import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const results = {};
  
  const tables = ['products', 'categories', 'brands', 'category_products', 'product_images', 'reviews', 'product_concerns', 'concerns'];
  
  for (const table of tables) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${table} LIMIT 1`);
      results[table] = { status: 'exists', columns: Object.keys(rows[0] || {}) };
    } catch (e) {
      results[table] = { status: 'error', error: e.message };
    }
  }
  
  return NextResponse.json(results);
}
