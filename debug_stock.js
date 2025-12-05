import fs from 'fs';
import path from 'path';
import { createPool } from '@vercel/postgres';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function checkStock() {
    const pool = createPool({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        const { rows } = await pool.query('SELECT id, name, stock_quantity, status FROM products ORDER BY id DESC LIMIT 20');
        let output = 'Products stock check:\n';
        output += '--------------------------------------------------\n';
        rows.forEach(row => {
            const cleanName = row.name ? row.name.replace(/[\r\n]+/g, ' ').trim().substring(0, 20) : 'No Name';
            const stock = row.stock_quantity;
            const stockType = typeof stock;
            const status = row.status || 'NULL';

            output += `ID: ${String(row.id).padEnd(4)} | Name: ${cleanName.padEnd(22)} | Stock: ${String(stock).padEnd(6)} (Type: ${stockType}) | Status: ${status}\n`;
        });
        output += '--------------------------------------------------\n';
        fs.writeFileSync('debug_output.txt', output);
        console.log('Output written to debug_output.txt');
    } catch (err) {
        console.error('Error querying database:', err);
        fs.writeFileSync('debug_output.txt', `Error: ${err.message}`);
    } finally {
        await pool.end();
    }
}

checkStock();
