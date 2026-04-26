import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import db from './lib/db.js';

async function run() {
  const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
  console.log(res.rows.map(r => r.column_name));
  process.exit(0);
}
run();