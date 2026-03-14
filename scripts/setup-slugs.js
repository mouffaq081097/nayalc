import { createPool } from '@vercel/postgres';

const db = createPool();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function run() {
  const client = await db.connect();
  try {
    console.log('--- Database Setup Start ---');
    
    // 1. Add slug column
    console.log('Adding slug column...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
    `);

    // 2. Fetch products
    const { rows: products } = await client.query('SELECT id, name FROM products');
    console.log(`Found ${products.length} products.`);

    for (const product of products) {
      let baseSlug = slugify(product.name);
      let slug = baseSlug;
      let counter = 1;

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
      console.log(`Updated ID ${product.id} -> ${slug}`);
    }

    // 3. Add UNIQUE constraint
    console.log('Adding UNIQUE constraint to slug...');
    try {
        await client.query('ALTER TABLE products ADD CONSTRAINT unique_product_slug UNIQUE (slug);');
    } catch (e) {
        console.log('Constraint already exists or error:', e.message);
    }

    console.log('--- Database Setup Complete ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit();
  }
}

run();
