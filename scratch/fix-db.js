import db from './lib/db.js';

async function fixSchema() {
  const client = await db.connect();
  try {
    console.log('Checking database schema...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image TEXT;
    `);
    console.log('Success: profile_image column is now present in users table.');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    client.release();
    process.exit();
  }
}

fixSchema();
