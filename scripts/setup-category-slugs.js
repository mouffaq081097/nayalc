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
    console.log('--- Category SEO Architecture Setup Start ---');
    
    // 1. Add slug column if it doesn't exist
    console.log('Verifying slug column in categories...');
    await client.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
    `);

    // 2. Fetch categories
    const { rows: categories } = await client.query('SELECT id, name FROM categories');
    console.log(`Found ${categories.length} category universes.`);

    for (const category of categories) {
      let baseSlug = slugify(category.name);
      let slug = baseSlug;
      let counter = 1;

      // Check for uniqueness
      while (true) {
        const { rows: existing } = await client.query(
          'SELECT id FROM categories WHERE slug = $1 AND id != $2',
          [slug, category.id]
        );
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await client.query(
        'UPDATE categories SET slug = $1 WHERE id = $2',
        [slug, category.id]
      );
      console.log(`Synchronized: ${category.name} -> /collections/${slug}`);
    }

    // 3. Add UNIQUE constraint
    console.log('Finalizing unique constraints...');
    try {
        await client.query('ALTER TABLE categories ADD CONSTRAINT unique_category_slug UNIQUE (slug);');
    } catch (e) {
        console.log('Constraint already active.');
    }

    console.log('--- Category SEO Architecture Complete ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit();
  }
}

run();
