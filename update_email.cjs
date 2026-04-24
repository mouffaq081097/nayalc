const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_kXgBAdF35PQa@ep-muddy-fire-adjoaugb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function updateEmail() {
  try {
    const res = await pool.query("UPDATE users SET email = 'mouffaq.dalloul@nayalc.com' WHERE email = 'mouffaq@nayalc.com' RETURNING email");
    if (res.rows.length) {
        console.log('Success! Your user account email is now:', res.rows[0].email);
    } else {
        console.log('No user found with the old email.');
    }
  } catch (e) {
    console.error('Database error:', e);
  } finally {
    await pool.end();
  }
}

updateEmail();