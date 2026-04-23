const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const db = createPool({
    connectionString: process.env.POSTGRES_URL
  });

  try {
    console.log('Adding "form" column to products table...');
    await db.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS form TEXT;');
    console.log('Successfully added "form" column.');
  } catch (error) {
    console.error('Error adding "form" column:', error);
  } finally {
    await db.end();
  }
}

migrate();
