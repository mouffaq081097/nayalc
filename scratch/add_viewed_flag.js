import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const { default: db } = await import('../lib/db.js');
  try {
    await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;");
    console.log("Column added");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();