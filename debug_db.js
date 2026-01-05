const fs = require('fs');
const path = require('path');
const { createPool } = require('@vercel/postgres');

// Load .env.local manually
try {
  const envPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
        process.env[key] = value;
      }
    });
    console.log('.env.local loaded');
  } else {
    console.log('.env.local not found');
  }
} catch (e) {
  console.error('Error loading .env.local', e);
}

const db = createPool();

async function checkUsers() {
  const client = await db.connect();
  try {
    const result = await client.query('SELECT id, username, email, password_hash FROM users');
    console.log('Users found:', result.rows.length);
    result.rows.forEach(user => {
        console.log(`User: ${user.email}, Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
    });
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    client.release();
  }
}

checkUsers();