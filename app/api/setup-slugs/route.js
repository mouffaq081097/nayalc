import { NextResponse } from 'next/server';
import db from '@/lib/db';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-');       // Replace multiple - with single -
}

export async function GET() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Add slug column if it doesn't exist
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);

    // 2. Fetch all products to generate slugs
    const { rows: products } = await client.query('SELECT id, name FROM products');

    const updated = [];
    for (const product of products) {
      let baseSlug = slugify(product.name);
      let slug = baseSlug;
      let counter = 1;

      // Ensure uniqueness (basic check)
      while (true) {
        const { rows: existing } = await client.query(
          'SELECT id FROM products WHERE slug = $1 AND id != $2',
          [slug, product.id]
        );
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await client.query(
        'UPDATE products SET slug = $1 WHERE id = $2',
        [slug, product.id]
      );
      updated.push({ id: product.id, name: product.name, slug });
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      message: 'Slugs generated and column added successfully',
      count: updated.length,
      samples: updated.slice(0, 5)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up slugs:', error);
    return NextResponse.json({ message: 'Error setting up slugs', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
